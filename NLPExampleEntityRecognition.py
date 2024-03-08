import nltk
import spacy
import mysql.connector as mysql
import traceback
from nltk.corpus import stopwords  
from nltk.tokenize import word_tokenize

nlp = spacy.load("en_core_web_sm")

#for the entities, we need the title and body of the article and the database article id
sql = "SELECT body,id,title FROM articles where body like '%%'"
cavdailydb = mysql.connect(
        host="usersrv01.cs.virginia.edu",
        password="F4Vswt5L!",
        database="cavdaily",
        username="cavdaily",
        autocommit=True,
    )
mycursor = cavdailydb.cursor()
mycursor.execute(sql)
selected_articles = mycursor.fetchall()
orgs_unique = {}

nltk.download('stopwords')
nltk.download('punkt')
stop_words = set(stopwords.words('english')) 

class Entity:
    def __init__(self, entity, article_id):
        self.type = entity.label_
        self.name = ""
        do = False
        for w in word_tokenize(entity.text.lower()):
            if w not in stop_words:
                if do: 
                    self.name += " "
                self.name += w
                do = True
        self.name = self.name.lower()
        if self.name == "university virginia" or self.name == "university":
            self.name = "uva"
        self.article = article_id
        self.altname = entity.text

class Organizations:
    def __init__(self):
        self.orgs = {}
    
    # can try to wrap these two into one main add() method that handles the exception 
    def add_new_org(self, org_entity):
        self.orgs[org_entity.name] = [[org_entity.article],[org_entity.altname]]

    def add_org(self, org_entity):
        try:
            articles = self.orgs[org_entity.name][0]
            names = self.orgs[org_entity.name][1]
            if org_entity.article not in articles:
                self.orgs[org_entity.name][0].append(org_entity.article)
            if org_entity.altname not in names:
                self.orgs[org_entity.name][1].append(org_entity.altname)
        except:
            self.add_new_org(org_entity)

clean_orgs = Organizations()

for item in selected_articles:  
    doc = nlp(item[2] + " " + item[0])
    article_id = item[1]
    title = item[2]
    

#Find named entities, phrases and concepts
    for entity in doc.ents:
        e = Entity(entity, article_id)
        if e.type == 'ORG':
            clean_orgs.add_org(e)
            print(e.name)
            print(clean_orgs.orgs[e.name])

num_wrong = 0

for key in clean_orgs.orgs.keys():
    try:
        norm_name = key 
        alt_names = clean_orgs.orgs[key][1]
        articles = clean_orgs.orgs[key][0]
        sql_entities = "INSERT INTO entities (type, norm_name) VALUES (%s, %s)"
        val_entities = ("org", norm_name)
        mycursor.execute(sql_entities, val_entities)
        cavdailydb.commit()
        #execute another query to SELECT LAST_INSERT_ID(); --> tells last id of something inserted 
        # this can clean up the nested select statement below 
        # also make 3rd insert into the article id-name id table 
        for name in alt_names:
            sql_alt_entity_names = "INSERT INTO alt_entity_names (entity_id, entity_type, alt_name) VALUES ((SELECT id FROM entities WHERE norm_name=%s), %s, %s)"
            val_alt_entity_names = (norm_name, "org", name)
            mycursor.execute(sql_alt_entity_names, val_alt_entity_names)
            cavdailydb.commit()
    except:
        print("error!")
        num_wrong +=1

print(num_wrong)

    

    
