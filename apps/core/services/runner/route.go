package runner

import (
	log "packages/logging"
	"net/http"

	"core/internal/k8s"
	"core/internal/redis"
	"packages/utils/json"
)

func NewHandler(rds *redis.Redis) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("DELETE /{replId}", func(w http.ResponseWriter, r *http.Request) {
		endReplSession(w, r, rds)
	})

	return mux
}

func endReplSession(w http.ResponseWriter, r *http.Request, rds *redis.Redis) {

	replId := r.PathValue("replId")

	repl, err := rds.GetRepl(replId)
	if err != nil {
		json.WriteError(w, http.StatusBadRequest, "This Repl Id doesn't exists")
		return
	}
	userName := repl.User

	if err := rds.DeleteReplSession(replId); err != nil {
		json.WriteError(w, http.StatusInternalServerError, "Unable to Create Repl Session")
	}

	if err := k8s.DeleteReplDeploymentAndService(userName, replId); err != nil {
		log.Error("K8s repl deletion failed", "repl_id", replId, "user", userName, "error", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}
