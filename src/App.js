import { css } from '@emotion/css';
import { useNavigate } from './router.js';

const navStyle = css`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: #3498db;

  a {
    font-size: 24px;
    padding: 5px 20px;
    cursor: pointer;
    user-select: none;
    text-decoration: none;
    :hover {
      background-color: #2980b9;
    }
    :visited {
      color: white;
    } 
  }
`;

const Nav = () => {
  const [,setUrl] = useNavigate('nav');

  const navigateTo = (e, url) => {
    // 阻止a tag的默认行为，就是不让跳转
    e.preventDefault();
    setUrl(url);
  }

  return (
    <div className={navStyle}>
      <a href="/dashbroad" onClick={e => navigateTo(e, '/dashbroad')}>总览</a>
      <a href="/month" onClick={e => navigateTo(e, '/month')}>月度视图</a>
    </div>
  )
}

function App() {
  const [view,] = useNavigate('app');

  return (
    <div>
      <Nav />
      {view}
    </div>
  );
}

export default App;
