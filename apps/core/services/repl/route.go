package repl

import (
	"fmt"
	"net/http"
	log "packages/logging"
	"strings"

	"core/cmd/middleware"
	"core/internal/k8s"
	"core/models"
	"core/pkg/dotenv"
	"packages/utils/json"

	"github.com/google/uuid"
)

func NewHandler(s3Client replStorage, rds replStore) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /test", func(w http.ResponseWriter, r *http.Request) {
		log.Info("Protected route accessed")
		json.WriteJSON(w, http.StatusOK, "Success")
	})

	mux.HandleFunc("POST /new", func(w http.ResponseWriter, r *http.Request) {
		newRepl(w, r, s3Client, rds)
	})
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		getUserRepls(w, r, rds)
	})
	mux.HandleFunc("GET /session/{replId}", func(w http.ResponseWriter, r *http.Request) {
		activateRepl(w, r, rds)
	})
	mux.HandleFunc("DELETE /session/{replId}", func(w http.ResponseWriter, r *http.Request) {
		deactivateRepl(w, r, rds)
	})
	mux.HandleFunc("DELETE /{replId}", func(w http.ResponseWriter, r *http.Request) {
		deleteRepl(w, r, s3Client, rds)
	})

	return mux
}

func newRepl(w http.ResponseWriter, r *http.Request, s3Client replStorage, rds replStore) {

	var repl *newReplRequest
	if err := json.ReadJSON(r, &repl); err != nil {
		json.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get User from auth
	user, _ := middleware.GetUserFromContext(r.Context())

	if userRepls, err := rds.GetUserRepls(user.Id); err == nil && len(userRepls) == 2 {
		log.Warn("Repl limit reached", "user", user.Name, "limit", 2)
		json.WriteError(w, http.StatusInternalServerError, "Free Account Limit Reached")
		return
	}

	// Create Repl ID
	id := uuid.New()
	replId := fmt.Sprintf("repl-%s", strings.TrimSpace(id.String()))

	sourcePrefix := fmt.Sprintf("templates/%s", repl.Template)
	destinationPrefix := fmt.Sprintf("repl/%s/%s/", user.Id, replId)

	if err := s3Client.CopyFolder(sourcePrefix, destinationPrefix); err != nil {
		log.Error("S3 copy template failed", "user", user.Id, "repl_id", replId, "template", repl.Template, "error", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create Repl in Store
	replEntry := models.Repl{
		User:     user.Name,
		UserId:   user.Id,
		Template: repl.Template,
		Name:     repl.ReplName,
		Id:       replId,
		IsActive: false,
	}

	if err := rds.CreateRepl(&replEntry); err != nil {
		log.Error("Create repl record failed", "user", user.Id, "repl_id", replId, "template", repl.Template, "error", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}

func deleteRepl(w http.ResponseWriter, r *http.Request, s3Client replStorage, rds replStore) {

	user, _ := middleware.GetUserFromContext(r.Context())

	replId := r.PathValue("replId")

	repl, err := rds.GetRepl(replId)
	if err != nil {
		json.WriteError(w, http.StatusBadRequest, "This Repl Id doesn't exists")
		return
	}
	if repl.UserId != user.Id {
		json.WriteError(w, http.StatusUnauthorized, "This User doesn't have access to this Repl")
		return
	}

	if repl.IsActive == true {
		if err := rds.DeleteReplSession(replId); err != nil {
			json.WriteError(w, http.StatusInternalServerError, "Unable to Create Repl Session")
			return
		}
	}

	target := fmt.Sprintf("repl/%s/%s/", user.Id, repl.Id)
	if err := s3Client.DeleteFolder(target); err != nil {
		log.Error("S3 delete failed", "user", user.Id, "repl_id", repl.Id, "error", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create Repl in Store
	if err := rds.DeleteRepl(repl.Id); err != nil {
		log.Error("Delete repl record failed", "user", user.Id, "repl_id", repl.Id, "error", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}

func getUserRepls(w http.ResponseWriter, r *http.Request, rds replStore) {

	user, _ := middleware.GetUserFromContext(r.Context())

	replIds, err := rds.GetUserRepls(user.Id)
	if err != nil {
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var repls []models.Repl
	for _, id := range replIds {
		repl, err := rds.GetRepl(id)
		if err != nil {
			log.Warn("Repl ID does not exist for user", "repl_id", id, "user", user.Id, "error", err)
			continue
		}
		repls = append(repls, repl)
	}

	json.WriteJSON(w, http.StatusOK, repls)
}

func activateRepl(w http.ResponseWriter, r *http.Request, rds replStore) {

	user, _ := middleware.GetUserFromContext(r.Context())

	replId := r.PathValue("replId")

	repl, err := rds.GetRepl(replId)
	if err != nil {
		log.Warn("Invalid repl id", "repl_id", replId, "error", err)
		json.WriteError(w, http.StatusBadRequest, "This Repl Id doesn't exists")
		return
	}
	if repl.UserId != user.Id {
		json.WriteError(w, http.StatusUnauthorized, "This User doesn't have access to this Repl")
		return
	}

	if err := rds.CreateReplSession(replId); err != nil {
		json.WriteError(w, http.StatusInternalServerError, "Unable to Create Repl Session")
	}

	if err := k8s.CreateReplDeploymentAndService(user.Id, replId, repl.Template); err != nil {
		log.Error("K8s deployment failed", "repl_id", replId, "user", user.Id, "template", repl.Template, "error", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	url := fmt.Sprintf("https://%s/%s/ping", dotenv.EnvString("RUNNER_CLUSTER_IP", "localhost:8081"), replId)

	if err := pingRunner(url); err != nil {
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, map[string]string{
		"replId":   replId,
		"replName": repl.Name,
	})
}

func deactivateRepl(w http.ResponseWriter, r *http.Request, rds replStore) {

	user, _ := middleware.GetUserFromContext(r.Context())

	replId := r.PathValue("replId")

	repl, err := rds.GetRepl(replId)
	if err != nil {
		json.WriteError(w, http.StatusBadRequest, "This Repl Id doesn't exists")
		return
	}
	if repl.UserId != user.Id {
		json.WriteError(w, http.StatusUnauthorized, "This User doesn't have access to this Repl")
		return
	}

	if err := rds.DeleteReplSession(replId); err != nil {
		json.WriteError(w, http.StatusInternalServerError, "Unable to Create Repl Session")
	}

	if err := k8s.DeleteReplDeploymentAndService(user.Id, replId); err != nil {
		log.Error("K8s repl deletion failed", "repl_id", replId, "user", user.Id, "error", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}
