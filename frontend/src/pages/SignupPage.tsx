import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignup } from '../features/auth/useSignup';

const inputStyle = {
  border: 'none',
  borderBottom: '1px solid #E5E5E1',
  padding: '8px 0',
  width: '100%',
};

const buttonStyle = {
  width: '100%',
  backgroundColor: '#00754A',
  color: '#fff',
  border: 'none',
  padding: '10px 0',
};

function SignupPage() {
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const navigate = useNavigate();
  const signupMutation = useSignup();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setClientError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setClientError(null);
    signupMutation.mutate(
      { name, loginId, password },
      { onSuccess: () => navigate('/login') },
    );
  }

  const errorMessage = clientError ?? (signupMutation.isError ? signupMutation.error.message : null);

  return (
    <form onSubmit={handleSubmit}>
      <input
        style={inputStyle}
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        style={inputStyle}
        placeholder="로그인 ID"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
      />
      <input
        style={inputStyle}
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        style={inputStyle}
        type="password"
        placeholder="비밀번호 확인"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
      />
      {errorMessage && <div>{errorMessage}</div>}
      <button type="submit" style={buttonStyle}>
        가입하기
      </button>
      <Link to="/login">이미 계정이 있나요? 로그인</Link>
    </form>
  );
}

export default SignupPage;
