"use strict";

class Profile extends AccountSettings {
    companyToChange = "";
    emailToChange = "";
    imageToChange = "";
    passwordToChange = "";
    nameToChange = "";
    source = "";

    nameInput = document.getElementById('name-input')
    emailInput = document.getElementById('email-input');
    orgInput = document.getElementById('org-input');
    passwordInput = document.getElementById('password-input');
    updateButton = document.getElementById('update-profile-btn');
    orgUpdateButton = document.getElementById('update-organization-btn')
    updateImage = document.getElementById('new-profile-image');
    updateOrganizationImage = document.getElementById('new-organization-image');

    constructor(accountInfo, blockAccess, ServerBaseURL, csrfToken, sent) {
        super(accountInfo);
        this.accountInfo = accountInfo;
        this.socket = null;
        this.ServerBaseURL = ServerBaseURL;
        this.csrfToken = csrfToken;
        this.sent = sent;

        if(blockAccess){
            if(document.getElementById("invite-btn") !== null){
                document.getElementById("invite-btn").style.display = "none"
            }
          
            if (sent){
                document.getElementById("email-msg").innerHTML = accountInfo.email
                document.getElementById("profile-container").style.display = "none"
                document.getElementById("verify-email").style.display = "block"
            }
            this.updateButton.onclick = async () => await this.setupProfile();
            this.nameInput.onkeyup = e =>this.onNameChangeSetUp(e);
            if(this.orgInput !== null){
                this.orgInput.onkeyup = e => this.onCompanyChangeSetUp(e);
            }
            
            if(this.passwordInput !== null){
                this.passwordInput.onkeyup = e => this.onPasswordChangeSetUp(e);
            }

            if(this.emailInput !== null){
                this.emailInput.onkeyup = e => this.onEmailChangeSetUp(e);
            }

            this.checkForEmptyForm("setup");
        }else{
            let imageUploads = Array.from(document.getElementsByClassName("setting-image-container"))
            for (let i = 0; i < imageUploads.length; i++){
                imageUploads[i].style.display = "block"
            }

            this.updateButton.onclick = async () => await this.updateProfile();
            this.nameInput.onkeyup = e =>this.onNameChange(e);
            this.emailInput.onkeyup = e => this.onEmailChange(e);
            if (this.orgInput != null){ 
                this.orgInput.onkeyup = e => this.onCompanyChange(e);
            }
            
            if(this.passwordInput !== null){
                this.passwordInput.onkeyup = e => this.onPasswordChange(e);
            }
            this.checkForEmptyForm();
        }

        if (this.nameInput.placeholder == "Name"){
            if( document.getElementById('top-nav-name') !== null){
                document.getElementById('top-nav-name').innerText = this.email;
            }
        }

        this.updateImage.onchange = e => this.onImageChange(e,"profile", blockAccess);
        this.updateOrganizationImage.onchange = e => this.onImageChange(e, "organization",blockAccess);

        this.orgUpdateButton.onclick = async () => await this.updateOrganization();
    }

    onImageChange(e,type,restircted){
        this.hideUpdateMessage(type);
        let file = e.target.files[0]
        if(this.isFileImage(file)){
            let reader = new FileReader();
            let imgtag = document.getElementById("setting-" + type + "-id");
            reader.onload = function(e) {
                imgtag.src = e.target.result;
            };

            reader.readAsDataURL(file);
        }
        if(restircted){
            this.checkForEmptyForm("setup");
            return
        }
        
        this.checkForEmptyForm();
    }

    hideUpdateMessage(type){
        let updateMsgDiv = document.getElementById(type+"-update-message");
        if(updateMsgDiv !== null){
            updateMsgDiv.classList.add("display-hidden");
        }
    }
 
    onNameChange(e){
        this.nameToChange = e.target.value;
        this.hideUpdateMessage("profile");
        this.checkForEmptyForm();
    }

    onCompanyChange(e) {
        this.companyToChange = e.target.value;
        this.hideUpdateMessage("organization");
        this.checkForEmptyForm();
    }

    onEmailChange(e) {
        this.emailToChange = e.target.value;
        this.hideUpdateMessage("profile");
        this.checkForEmptyForm();
    }

    onPasswordChange(e) {
        this.passwordToChange = e.target.value;
        this.hideUpdateMessage("profile");
        this.checkForEmptyForm();
    }

    onNameChangeSetUp(e){
        this.nameToChange = e.target.value;
        this.checkForEmptyForm("setup");
    }

    onCompanyChangeSetUp(e) {
        this.companyToChange = e.target.value;
        this.checkForEmptyForm("setup");
    }

    onEmailChangeSetUp(e) {
        this.emailToChange = e.target.value;
        this.checkForEmptyForm("setup");
    }

    onPasswordChangeSetUp(e) {
        this.passwordToChange = e.target.value;
        this.checkForEmptyForm("setup");
    }

    checkForEmptyForm(setup) {
        if(setup !== null && setup !== undefined){
            if(this.orgInput !== null){
                if (this.nameInput.value === '' || this.emailInput.value ===''|| this.orgInput.value ==='') {
                    document.getElementById("profile-update-message").classList.add("display-hidden");
                    this.updateButton.classList.add('disable-btn');
                    document.getElementById("email-error").innerText = "Please update the rest of the fields to continue"
                    return
                }

                document.getElementById("email-error").innerText = ""
                this.updateButton.classList.remove('disable-btn');
                return
            }else{
                if (this.nameInput.value === '' || this.emailInput.value ==='') {
                    document.getElementById("profile-update-message").classList.add("display-hidden");
                    this.updateButton.classList.add('disable-btn');
                    return
                }

                this.updateButton.classList.remove('disable-btn');
                return
            }
        }

        let pwInput = '';
        if(this.passwordInput !== null){
            pwInput = this.passwordInput.value; 
        }

        if (this.nameInput.value === '' &&this.emailInput.value ==='' && pwInput == '' && typeof (document.getElementById("new-profile-image").files[0]) === 'undefined' && !this.isFileImage(document.getElementById("new-profile-image").files[0])) {
            this.updateButton.classList.add('disable-btn');
        } else {
            this.updateButton.classList.remove('disable-btn');
        }

        if ((this.orgInput != null && this.orgInput.value === '') && typeof (document.getElementById("new-organization-image").files[0]) === 'undefined' && !this.isFileImage(document.getElementById("new-organization-image").files[0])) {
            this.orgUpdateButton.classList.add('disable-btn');
        } else {
            this.orgUpdateButton.classList.remove('disable-btn');
        }
    }

    checkRequirements(password) {
        if(this.passwordInput !== null){
            password = this.passwordInput.value;
        }
        const list = ['!', '@', '#', '$', '%', '&', '(', ')', '-', '_', '[', ']', '{', '}', ';', ':', '"', '.', '/', '<', '>', '?'];
        var hs = false; // Has Symbols
        var hn = false; // Has Numbers
        var hu = false; // Has Uppercase
        var hl = false; // Has Lowercase
        var true_count = 0;
        if (password.length >= 8) {
            for (var i = 0; i < password.length; i++) {
                var letter = password.charAt(i);
                if(list.includes(letter)) {
                    if(hs == false) {
                        true_count++;
                    }
                    hs = true;
                } else if (!isNaN(parseFloat(letter)) && isFinite(letter)) {
                    if(hn == false) {
                        true_count++;
                    }
                    hn = true;
                } else if (letter == letter.toUpperCase()) {
                    if(hu == false) {
                        true_count++;
                    }
                    hu = true;
                } else if (letter == letter.toLowerCase()) {
                    if(hl == false) {
                        true_count++;
                    }
                    hl = true;
                }else{
                    return false
                }
            }
            if (true_count >= 3) {
                return true;
            }
        }else{
            return false;
        }
    }


    isFileImage(file) {
        return file && file['type']. split('/')[0] === 'image';
    }

    updateMessageOk(type){
        if( document.getElementById("email-error") != null){
            document.getElementById("email-error").innerText = "";
        }
        document.getElementById(type+"-update-message").innerText = "Changes saved ✅";
        document.getElementById(type+"-update-message").classList.remove("red");
        document.getElementById(type+"-update-message").classList.add("green");
        document.getElementById(type+"-update-message").classList.remove("display-hidden");
    }

    updateMessageFailed(type,text){
        document.getElementById(type+"-update-message").innerText = text;
        document.getElementById(type+"-update-message").classList.remove("green");
        document.getElementById(type+"-update-message").classList.add("red");
        document.getElementById(type+"-update-message").classList.remove("display-hidden");
    }

    async updateProfile() {
        let imgStatus = await this.uploadImage("new-profile-image","profile-picture","profile");

        let profileInfo = {
            OldEmail: this.email,
            NewPassword: this.passwordToChange,
        };

        if((this.nameToChange !== "Name")&& (this.nameToChange !== "")){
            profileInfo.Name = this.nameToChange;
        }else{
            profileInfo.Name = this.nameInput.placeholder;
        }

        if(this.emailToChange === ''){
            profileInfo.NewEmail = this.emailInput.placeholder;
        }else{
            profileInfo.NewEmail = this.emailToChange;
        }

        if(this.passwordToChange !== '')
            if (!this.checkRequirements(this.passwordToChange)){
                document.querySelector('.bad-password').style.display = 'block';
                this.modalAlert("Failed to save profile updates");
                return;
            }else{
                document.querySelector('.bad-password').style.display = 'none';
        }
        
        const options = {
            method: 'POST',
            headers: {  
                'Content-type': 'application/json', 
                'X-CSRF-Token': this.csrfToken 
            },
            body: JSON.stringify(profileInfo),
        };

        try {
            let response = await fetch('/update-profile', options);

            if (response.status === 200) {
                if(imgStatus !== 200){
                    this.updateMessageFailed("profile","failed to upload image. The accepted types are image/png, image/jpeg, image/gif");
                }else{
                    this.updateMessageOk("profile");
                }

                this.email = profileInfo.NewEmail;
                this.accountInfo.email = profileInfo.NewEmail;
                if (profileInfo.Name == "Name"){
                    document.getElementById('top-nav-name').innerText = profileInfo.NewEmail;
                }else{
                    document.getElementById('top-nav-name').innerText = profileInfo.Name;
                }
                this.handleSubmitState();
                            
            }else{
                this.handleSubmitStateFail();
                this.updateMessageFailed("profile","Error updating profile, please contact support");
            }
            
        } catch (e) {
            this.handleSubmitStateFail();
            this.updateMessageFailed("profile","Failed to update, please contact support");
        }

    }

    async updateOrganization(){
        let imgStatus = await this.uploadImage("new-organization-image","organization-picture","organization");

        if(this.companyToChange !== ""){
            const options = {
                method: 'POST',
                body: JSON.stringify({
                    "NewCompany" : this.companyToChange
                    }),
                headers: {  
                    'X-CSRF-Token': this.csrfToken 
                },
            }

            try {
                const res = await fetch('/update-organization-name', options);
                if(res.status === 200){
                    this.orgInput.placeholder = this.companyToChange;
                    document.getElementById("left-nav-org").innerText = this.companyToChange;
                    document.getElementById("team-name").innerText = this.companyToChange + " Team";
                    this.orgInput.value = "";
                    this.companyToChange = "";

                    if(imgStatus === 200){
                        this.updateMessageOk("organization");
                        this.checkForEmptyForm();
                    }else{
                        this.updateMessageFailed("organization","failed to upload image");
                        this.checkForEmptyForm();
                    }
                    
                }
            } catch (e) {
                this.updateMessageFailed("organization","Failed to update, please contact support");
                console.error(e);
            }
        }else if(imgStatus !== 200){
            this.updateMessageFailed("organization","failed to upload image. The accepted types are image/png, image/jpeg, image/gif");
        }

        
    }

    async uploadImage(imgInputID, updateImageID, type){
        if(document.getElementById(imgInputID) === null){
            return 400
        }

        if(typeof (document.getElementById(imgInputID).files[0]) !== 'undefined' && this.isFileImage(document.getElementById(imgInputID).files[0])){
            const formData = new FormData();
            formData.append("profile-image", document.getElementById(imgInputID).files[0]);
            formData.append("email",this.email);
            formData.append("type",type)
    
            const optionsImage = {
                method: 'POST',
                body: formData,
                headers: {  
                    'X-CSRF-Token': this.csrfToken 
                },
            }
    
            try {
                const res = await fetch('/settings-upload-img', optionsImage);
                if(res.status == 200){
                    if(type === "profile"){
                        if(this.isFileImage(document.getElementById(imgInputID).files[0]) && updateImageID !== "" && updateImageID !==null){
                            let reader = new FileReader();
                            let imgtag = document.getElementById(updateImageID);
                            reader.onload = function(e) {
                                imgtag.src = e.target.result;
                            };
                            reader.readAsDataURL(document.getElementById(imgInputID).files[0]);

                            if(typeof (document.getElementById(imgInputID).files[0]) !== 'undefined'){
                                document.getElementById(imgInputID).value="";
                            }

                            this.updateButton.classList.add('disable-btn');
                        }
                    }else if(type =="organization"){
                        res.json().then(() => {
                            let imgtag = document.getElementById("organization-logo");
                            imgtag.src =document.getElementById("setting-organization-id").src;
                            if(typeof (document.getElementById(imgInputID).files[0]) !== 'undefined'){
                                document.getElementById(imgInputID).value="";
                            }

                            this.updateMessageOk("organization");
                            this.checkForEmptyForm();
                        })
                    }else if(type =="setup"){
                        res.json().then(() => {
                            let imgtag = document.getElementById("organization-logo");
                            imgtag.src =document.getElementById("setting-setup-id").src;
                            if(typeof (document.getElementById(imgInputID).files[0]) !== 'undefined'){
                                document.getElementById(imgInputID).value="";
                            }

                            this.checkForEmptyForm();
                        })
                    }

                    return res.status
                }else{
                    document.getElementById(imgInputID).value="";
                    return res.status
                }
            } catch (e) {
                this.handleSubmitStateFail();
                console.error(e);
            }
        }

        return 200
    }

    modalAlert(textError) {
        document.getElementById('error-message').innerText = textError;
    }

    updateNameField(){
        this.nameInput.placeholder = this.nameToChange
        this.nameInput.value = ""
        this.nameToChange = ""
    }

    updateEmailField(){
        this.emailInput.placeholder = this.emailToChange
        this.emailInput.value = ""
        this.emailToChange = ""
    }

    updateCompanyField(){
        if(this.orgInput != null){
            this.orgInput.placeholder = this.companyToChange
            this.orgInput.value = ""
        }
        this.companyToChange = ""
        
    }

    handleSubmitStateSetup(){
        if(this.nameToChange !== "" && this.nameInput !== null){
            this.updateNameField()
        }

        if(this.emailToChange !== "" && this.nameInput !== null|| (this.emailInput.value !=="")){
            this.emailInput.placeholder = this.emailInput.value;
            this.emailToChange = ""
        }

        if(this.companyToChange !== "" && this.nameInput !== null){
            this.updateCompanyField()
        }

        this.checkForEmptyForm("setup");
    }

    handleSubmitState() {
        if(this.nameToChange !== ""){
            this.updateNameField()
        }

        if(this.emailToChange !== ""){
            this.updateEmailField()
        }

        if(this.companyToChange !== ""){
            this.updateCompanyField()
        }

        if(this.passwordToChange !== "" && this.passwordInput !== null){
            this.passwordInput.value = ""
            this.passwordToChange = "" 
        }
        this.checkForEmptyForm();
    }

    handleSubmitStateFail() {
        if(this.nameToChange !== ""){
            this.updateNameField()
        }

        if(this.emailToChange !== ""){
            this.updateEmailField()
        }

        if(this.companyToChange !== ""){
            this.updateCompanyField()
        }

        if(this.passwordToChange !== "" && this.passwordInput !== null){
            this.passwordInput.placeholder = "Update password"
            this.passwordToChange = ""
        }
        this.checkForEmptyForm();
    }

    handleSubmitStateFailSetup(){
        if(this.emailInput !== null){
            this.emailInput.value = "";
            this.emailToChange = "";
        }

        this.checkForEmptyForm();
    }

    clearInputFields(){
        this.emailInput.value = ""
        if (this.orgInput != null){
            this.orgInput.value = ""
        }
        this.passwordToChange = ""
        this.nameInput.value = ""

        this.companyToChange = ""
        this.emailToChange = ""
        this.nameToChange = ""
    }

    async setupProfile(){
        document.getElementById("email-error").innerText = "Processing..."
        document.getElementById("update-profile-btn").classList.add("disable-btn");
        await this.uploadImage("new-profile-image","profile-picture","profile");
        let source = this.getSourceValue();

        let emailSubscribeCb = document.getElementById("email-subscription")
        let emailSubscribe = false
        if (emailSubscribeCb != null){
            emailSubscribe = emailSubscribeCb.checked
        }

        let profileInfo = {
            NewCompany: this.companyToChange,
            OldEmail: this.email,
            Source: source,
            EmailSubscription: emailSubscribe
        };
        if((this.nameToChange !== "Name") && (this.nameToChange !== "")){
            profileInfo.Name = this.nameToChange;
        }else{
            if( this.nameInput.placeholder == ""){
                profileInfo.Name = this.nameInput.value;
            }else{
                profileInfo.Name = this.nameInput.placeholder;
            }
        }

        if(this.emailToChange === ''){
            profileInfo.NewEmail = this.email;
        }else{
            profileInfo.NewEmail = this.emailToChange;
        }

        document.getElementById("email-error").innerText = "";

        const options = {
            method: 'POST',
            headers: { 
                'Content-type': 'application/json',
                'X-CSRF-Token': this.csrfToken 
            },
            body: JSON.stringify(profileInfo),
        };

        fetch('/setup-profile', options)
        .then(response => response.status)
        .then(data => {
            if(data == 200){
                document.getElementById("update-profile-btn").classList.remove("disable-btn");
                this.email = profileInfo.NewEmail
                this.accountInfo.email = profileInfo.NewEmail;
                if (profileInfo.Name == "Name"){
                    document.getElementById('top-nav-name').innerText = profileInfo.NewEmail;
                }else{
                    document.getElementById('top-nav-name').innerText = profileInfo.Name;
                }

                let updateOrganizationNameInput = document.getElementById("org-block-input");
                if(updateOrganizationNameInput !== null){
                    updateOrganizationNameInput.placeholder = profileInfo.NewCompany;
                }

                if(this.orgInput !== null){
                    this.orgInput.placeholder = profileInfo.NewCompany;
                    document.getElementById("left-nav-org").innerText = profileInfo.NewCompany;
                    document.getElementById("team-name").innerText = profileInfo.NewCompany+ " Team";
                }

                this.emailInput.placeholder = profileInfo.NewEmail;
                this.sent = true;
                if(document.getElementById("source") !== null){
                    document.getElementById("source").innerHTML = "";
                }
                         
                this.socket =  setupSocketEmail(this.ServerBaseURL, this.csrfToken);
                document.getElementById("email-msg").innerHTML = profileInfo.NewEmail
                document.getElementById("profile-container").style.display = "none"
                document.getElementById("verify-email").style.display = "block"

                document.getElementById("email-error").style.color ="#006080";
                this.handleSubmitStateSetup();
                
                document.getElementById("profile-update-message").classList.remove("display-hidden");
            }else if(data == 303){
                document.getElementById("update-profile-btn").classList.remove("disable-btn");
                window.location = "/home";
            }else{
                document.getElementById("update-profile-btn").classList.remove("disable-btn");
                document.getElementById("email-error").innerText = "invalid work email or email aleady in use";
                document.getElementById("email-error").style.color = "red";
                this.handleSubmitStateFailSetup();
            }
        }).catch((error) =>{
            console.error(error);
        })
    }

    getSourceValue(){
        let elem = document.getElementsByName("source");

        for (let i = 0; i<elem.length; i++){
            if(elem[i].checked){
                if(elem[i].id === "other"){
                    return document.getElementById("other-value").value;
                }else{
                    return elem[i].value;
                }
            }
        }

        return "";
    }
}

