import {useTypedSelector} from '../redux/useTypedSelector';

export const useAuth = () => {
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const user = useTypedSelector(state => state.user);

  return {
    auth: firebase.auth,
    user: user,
    isLoggedIn: user.isLoggedIn,
  };
};
