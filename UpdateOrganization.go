// in a router file the following code would be executed: 
router.Handle("/update-organization-name", rt.UpdateOrganization())

// this function would then execute after the above code 
func (rt Router) UpdateOrganization() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		currentOrg, err := rt.OrganizationFromCookie(r)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
			return
		}

		var profileUpdate ProfileUpdate

		err = json.NewDecoder(r.Body).Decode(&profileUpdate)
		if err != nil {
			utility.HandleErrorWriter(w, err, http.StatusBadRequest)
			return
		}

		session, err := rt.SessionsStore.Get(r, "profile")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		profile, ok := session.Values["profile"].(map[string]interface{})
		if !ok {
			utility.HandleErrorWriter(w, errors.New("couldn't find profile"), http.StatusBadRequest)
			return
		}

		userMetadata, ok := profile[rt.Auth0Namespace+"user_metadata"].(map[string]interface{})
		if !ok {
			utility.HandleErrorWriter(w, errors.New("could not find user meta_data"), http.StatusInternalServerError)
			return
		}

		role, ok := userMetadata["role"].(string)
		if !ok {
			utility.HandleErrorWriter(w, errors.New("couldn't find role"), http.StatusBadRequest)
			return
		}

		if role != "admin" && role != "engineer" {
			utility.HandleErrorWriter(w, errors.New("incorrect role"), http.StatusUnauthorized)
			return
		}

		if profileUpdate.NewCompany != "" {
			err = rt.MariaDBClient.UpdateOrganizationName(currentOrg.Name, profileUpdate.NewCompany, currentOrg.UUID.String())
			if err != nil {
				utility.HandleErrorWriter(w, err, http.StatusBadRequest)
				return
			}
		}

		w.WriteHeader(http.StatusOK)
	}
}

//the database function executed in line 51 is as follows, and would be contained in a router package 
func (m MariaClient) UpdateOrganizationName(oldName string, newName string, organizationUUIDString string) error {
	organizationUUID, err := uuid.Parse(organizationUUIDString)
	if err != nil {
		return err
	}

	uuidBytes, err := organizationUUID.MarshalBinary()
	if err != nil {
		return err
	}

	update := m.Client.Model(&organization{}).Where("name = ? AND uuid = ?", oldName, uuidBytes).Update("name", newName)
	if update != nil {
		return update.Error
	}

	return nil
}

//upon completion, the status is returned to the JavaScript file, and the front end updates appropriately. 
