from html.parser import HTMLParser
from collections import deque
import datetime
import mysql.connector as mysql
import traceback



# Class that handles the wordpress articles
class WordPressParser(HTMLParser):
    def handle_starttag(self, tag, att):
        if att:
            if att[0] == ('class', 'author'):
                self.author = True;
            if att[0] == ('class', 'date'):
                self.date = True;
        self.tagStack.append(tag)

    def handle_data(self, data):
        if self.tagStack:
            if self.tagStack[-1] == 'title':
                self.articleTitle = data
            if self.tagStack[-1] == 'h3':
                self.articleCategory = data
            if self.tagStack[-1] == 'a' and self.author:
                self.articleAuthor = data
                self.author = False
            if self.tagStack[-1] == 'p':
                self.articleContent += data
            if self.tagStack[-1] == 'div' and self.date:
                self.date = False;
                self.articleDate = data.strip()

    def handle_endtag(self, tag):
        if tag == 'article':
            self.seenArticleTag = False
        if self.tagStack:
            self.tagStack.pop()

    seenArticleTag = False
    tagStack = deque()
    articleTitle = ""
    articleAuthor = ""
    articleContent = ""
    articleCategory = ""
    articleDate = ""
    author = False;
    date = False;


# Class that handles the State News Cav Daily Articles
class StateNewsParser(HTMLParser):
    def handle_starttag(self, tag, att):
        if tag == "article":
            self.seenArticleTag = True
        if tag != 'hr' and tag != 'br' and tag != 'img':
            self.tagStack.append(tag)


    def handle_data(self, data):
        if self.tagStack and self.tagStack[-1] == 'h1':
            self.articleTitle = data
        if self.seenArticleTag and self.tagStack:
            if self.tagStack[-1] == 'h3':
                self.articleCategory = data
            if self.tagStack[-1] == 'a' and self.author:
                self.articleAuthor = data
                self.author = False
            if self.tagStack[-1] == 'p':
                #print(self.tagStack)
                if self.tagStack[-2] == 'aside':
                    self.articleDate = data.strip()
                else:
                    self.articleContent += data
            if self.tagStack[-1] == 'aside':
                self.articleDate = data.strip()
        if not self.seenArticleTag and len(self.tagStack) >= 3:
            if self.tagStack[-1] == 'p' and self.tagStack[-2] == 'aside':
                self.articleDate = data.strip()
            if self.tagStack[-1] == 'a' and self.tagStack[-2] == 'p' and self.tagStack[-3] == 'aside':
                self.articleAuthor = data
                self.author = False


    # Method that identifies end tag and cleans up stack as data is processed
    def handle_endtag(self, tag):
        if tag == 'article':
            self.seenArticleTag = False
        if self.tagStack:
            self.tagStack.pop()

    # Fields required for class
    seenArticleTag = False
    tagStack = deque()
    articleTitle = ""
    articleAuthor = ""
    articleContent = ""
    articleCategory = ""
    articleDate = ""
    author = True

def convertdate(date):
    clean_date = date.split(" ")
    new_date = ""
    if clean_date[0][0:3] == "Jan":
        clean_date[0] = "01"
    if clean_date[0][0:3] == "Feb":
        clean_date[0] = "02"
    if clean_date[0][0:3] == "Mar":
        clean_date[0] = "03"
    if clean_date[0][0:3] == "Apr":
        clean_date[0] = "04"
    if clean_date[0][0:3] == "May":
        clean_date[0] = "05"
    if clean_date[0][0:3] == "Jun":
        clean_date[0] = "06"
    if clean_date[1][0:3] == "Jul":
        clean_date[0] = "07"
    if clean_date[0][0:3] == "Aug":
        clean_date[0] = "08"
    if clean_date[0][0:3] == "Sep":
        clean_date[0] = "09"
    if clean_date[0][0:3] == "Oct":
        clean_date[0] = "10"
    if clean_date[0][0:3] == "Nov":
        clean_date[0] = "11"
    if clean_date[0][0:3] == "Dec":
        clean_date[0] = "12"
    new_date = clean_date[2] + "-" + clean_date[0] + "-" + clean_date[1]
    return new_date

def main():

    wordpress_correct = 0
    wordpress_incorrect = 0
    statenews_correct = 0
    statenews_incorrect = 0

    cavdailydb = mysql.connect(
        host="usersrv01.cs.virginia.edu",
        password="F4Vswt5L!",
        database="cavdaily",
        username="cavdaily",
        autocommit=True,
    )

    mycursor = cavdailydb.cursor()
    state_news_f = open('/p/cavdaily/data/all_state_news.txt', 'r')
    for line in state_news_f:
        try: 
            filename = line.strip()

            stateNews = StateNewsParser()
            # We need the full path
            article_sn = open('/p/cavdaily/data/'+filename).read()
            stateNews.feed(article_sn)
            stateNews.close()
            if len(stateNews.articleDate) == 10 or len(stateNews.articleDate) == 12:
                stateNews.articleDate = stateNews.articleDate.split(" ")[-1]
                dateList = stateNews.articleDate.split("/")
                stateNews.articleDate = dateList[2] + "-" + dateList[0] + "-" + dateList[1]
            else:
                dateList = stateNews.articleDate.split("|")
                stateNews.articleDate = dateList[1].strip()
                stateNews.articleDate = convertdate(stateNews.articleDate)
            #sql = "INSERT INTO articles (title, author, category, date, body, parser, filename) VALUES (%s, %s, %s, %s, %s, %s, %s);"
            #val = (stateNews.articleTitle, stateNews.articleAuthor, stateNews.articleCategory, stateNews.articleDate, stateNews.articleContent, "stateNews", filename) 
            #mycursor.execute(sql, val)
            #cavdailydb.commit()
            #print(mycursor.rowcount, "record inserted.")
            statenews_correct += 1
        except Exception as err:
            # The try/except block hides other exceptions along with mysql errors, so
            # it might be that we get here without actually getting a MySQL issue.  It
            # might be a parsing issue or index out of bounds
            #traceback.print_exc()
            
            #print("Oops!", err, "occurred.\n")
            #print("not inserted -- ", filename)
            
            # this exits after the first exception, but remove to run all of state news
            statenews_incorrect +=1
    
    state_news_f.close()
    # Added a return statement to stop processing after state news for testing
    print("statenews correct = ")
    print(statenews_correct)
    print("statenews_incorrect = ")
    print(statenews_incorrect)
    wordpress_f = open('/p/cavdaily/data/all_wp.txt', 'r')
    for line in wordpress_f:
        try:
            filename = line.strip()

            wordpress = WordPressParser()
            article_wp = open('/p/cavdaily/data/'+filename).read()
            wordpress.feed(article_wp)
            wordpress.close()
            wpTitleList = wordpress.articleTitle.split("|")
            wordpress.articleTitle = wpTitleList[0]
            wpDateList = wordpress.articleDate.split("on ")
            wordpress.articleDate = wpDateList[1].split(",")
            wordpress.articleDate = wordpress.articleDate[0] + wordpress.articleDate[1]
            wordpress.articleDate = convertdate(wordpress.articleDate)

            #sql = "INSERT INTO articles (title, author, category, date, body, parser, filename) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            #val = (wordpress.articleTitle, wordpress.articleAuthor, wordpress.articleCategory, wordpress.articleDate, wordpress.articleContent, "wordpress", filename) 
            #mycursor.execute(sql, val)
            #cavdailydb.commit()
            #print(mycursor.rowcount, "record inserted.")
            wordpress_correct += 1
        except Exception as err:
            # The try/except block hides other exceptions along with mysql errors, so
            # it might be that we get here without actually getting a MySQL issue.  It
            # might be a parsing issue or index out of bounds
            #traceback.print_exc()
            #print("Oops!", err, "occurred.\n")
            print("not inserted -- ", filename)
            # above print statements commented out for trial without sql 

            # this exits after the first exception, but remove to run all of state news
            wordpress_incorrect += 1

    wordpress_f.close()
    print("wordpress correct = ")
    print(wordpress_correct)
    print("wordpress incorrect = ")
    print(wordpress_incorrect)
    # one counter for state news and one counter for wordpress (get total from the # of lines in the txt file )
    # succeeded and failed counter, if inserted, i++ to know how many work correctly 
    # let it parse all of them but don't put it in the db, see how many errors there are 
main()
