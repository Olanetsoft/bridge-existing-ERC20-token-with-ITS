import { Default } from 'components/layouts/Default';
import { RegisterExistingToken } from 'components/templates/interchain/register-token';

const RegisterToken = () => {
  return (
    <Default pageName="Register Existing Token">
      <RegisterExistingToken />
    </Default>
  );
};

export default RegisterToken;
