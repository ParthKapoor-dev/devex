package models

type Repl struct {
	Id       string `json:"id" redis:"id"`
	Name     string `json:"name" redis:"name"`
	User     string `json:"user" redis:"user"`
	UserId   string `json:"userId" redis:"userId"`
	Template string `json:"template" redis:"template"`
	IsActive bool   `json:"isActive" redis:"isActive"`
}
