import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLogin } from '../features/auth/useLogin';

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

function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const loginMutation = useLogin();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    loginMutation.mutate(
      { loginId, password },
      {
        onSuccess: (data) => {
          useAuthStore.getState().setAuth({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            role: data.user.role,
          });
          navigate(data.user.role === 'admin' ? '/admin' : '/');
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
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
      {loginMutation.isError && <div>{loginMutation.error.message}</div>}
      <button type="submit" style={buttonStyle}>
        로그인
      </button>
      <Link to="/signup">계정이 없나요? 회원가입</Link>
    </form>
  );
}

export default LoginPage;
