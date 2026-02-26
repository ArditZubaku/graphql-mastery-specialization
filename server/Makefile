users:
	curl -X POST https://graphql-mastery-specialization.onrender.com/graphql \
	-H "Content-Type: application/json" \
	-d '{ "query": "query { users { email id } }" }'

users-concurrently:
	hey -n 2000 -c 2000 \
		-m POST \
		-H "Content-Type: application/json" \
		-d '{"query":"query { users { email id } }"}' \
		https://graphql-mastery-specialization.onrender.com/graphql
