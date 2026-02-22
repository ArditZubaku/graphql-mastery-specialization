import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const GET_USERS = gql`
  query {
    users {
      id
      name
    }
  }
`;

const Users = () => {
  const { data, loading, error } = useQuery(GET_USERS);

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error :(</p>

  return (
    <ul>
      {
        data.users.map((user) => (
          <li key={user.id}>
            {user.name}
          </li>
        ))
      }
    </ul>
  );
}

export default Users;
