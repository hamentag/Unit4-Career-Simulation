
  

  // const [error, setError] = useState(null);
  // const [usr, setUsr] = useState({});

  // const [nextPath, setNextPath] = useState('/');

  // const navigate = useNavigate();


import { useState, useEffect } from 'react'

const Login = ({ login })=> {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submitT0Login = ev => {
    ev.preventDefault();
    login({ email, password });
  }
  return (
    <>
     <form onSubmit={ submitT0Login } >
      <input value={ email } placeholder='email' onChange={ ev=> setEmail(ev.target.value)}/>
      <input value={ password} placeholder='password' onChange={ ev=> setPassword(ev.target.value)}/>
      <button disabled={ !(email && password) }>Log In</button>
      </form>
    </>
  );
}

const Register = ({ register })=> {
  const [firstname, setFirstname ] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submitT0Register = ev => {
    ev.preventDefault();
    register({ email, password, firstname, lastname });
  }
  return (
    <>
     <form onSubmit={ submitT0Register }>
      <input value={ firstname} placeholder='First Name' onChange={ ev=> setFirstname(ev.target.value)}/>
      <input value={ lastname} placeholder='Last Name' onChange={ ev=> setLastname(ev.target.value)}/>
      <input value={ email } type='emaill' placeholder='email' onChange={ ev=> setEmail(ev.target.value)}/>
      <input value={ password} placeholder='password' onChange={ ev=> setPassword(ev.target.value)}/>
      <button disabled={ !(firstname && lastname && email && password) }>Continuer</button>
      </form>
    </>
  );
}


const DialogBox = ({msg, setMsg}) => {
  return(
    <>
        <div className="dialog-box">
            <div className="dialog-box-main">
                <p>{msg}</p>
                <button onClick={()=>{setMsg(null)}}>Close</button>
            </div>
        </div>
        <div className="overlay" onClick={()=>{setMsg(null)}}></div>
    </>
)
}

function App() {
  const [auth, setAuth] = useState({});
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [msg, setMsg] = useState(null);
  const [hasAccount, setHasAccount] = useState(true);
  
  useEffect(()=> {
    const token = window.localStorage.getItem('token');
    if(token){
      attemptLoginWithToken();
    }
  }, []);

  useEffect(()=> {
    const fetchProducts = async()=> {
      const response = await fetch('/api/products');
      const json = await response.json();
      if(response.ok){
        setProducts(json);
      }
      else{
        console.log(json);
      }
    };
    fetchProducts();
  }, []);

  useEffect(()=> {
    const fetchCart = async()=> {
      const response = await fetch(`/api/users/${auth.id}/cart`, {
        headers: {
          authorization: window.localStorage.getItem('token')
        }
      });
      const json = await response.json();
      if(response.ok){
        setCart(json);
      }
      else{
        console.error("") ///
      }
    };
    if(auth.id){
      fetchCart();
    }
    else {
      setCart([]);
    }
  }, [auth]);

  const addToCart = async(product_id)=> {
    const response = await fetch(`/api/users/${auth.id}/cart`, {
      method: 'POST',
      body: JSON.stringify({ product_id}),
      headers: {
        'Content-Type': 'application/json',
        authorization: window.localStorage.getItem('token')
      }
    });
    const json = await response.json();
    if(response.ok){
      setCart([...cart, json]);
    }
    else {
      // console.log(json);
    }
  };

  const removeFromCart = async(id)=> {
    const response = await fetch(`/api/users/${auth.id}/cart/${id}`, {
      method: 'DELETE',
      headers: {
        authorization: window.localStorage.getItem('token')
      }
    });
    setCart(cart.filter(item => item.product_id !== id));
  };

  const attemptLoginWithToken = async()=> {
    const token = window.localStorage.getItem('token');
    const response = await fetch('/api/auth/me', {
      headers: {
        authorization: token
      }
    });
    const json = await response.json();
    if(response.ok){
      setAuth(json);
    }
    else {
      window.localStorage.removeItem('token');
    }
  };

  const login = async(credentials)=> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const json = await response.json();
    if(response.ok){
      window.localStorage.setItem('token', json.token);
      attemptLoginWithToken();
    }
    else{
      console.error(json.error)
      setMsg("Incorrect email or password. Please try again.")
    }
  };

  const register = async(newUserData)=> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(newUserData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();    
    if(response.ok){
      setMsg("Success! Your account has been created.");
      login({ email: newUserData.email, password: newUserData.password });  
    }
    else{
      console.error(result.error);
      setMsg("Account creation failed with provided information.");
    }
  };

  const logout = ()=> {
    window.localStorage.removeItem('token');
    setAuth({});
  }

  return (
    <>
      <h1>Store</h1>
      {
        !auth.id ? <>
          {hasAccount? 
            <div className='login-form'>
              
              <Login login={login}/>
              Don't have an account? 
              <button onClick={()=>{setHasAccount(false)}}>Sign Up</button>
            </div>
            : 
            <div className='register-form'>
              <h3>Create account</h3>
              <Register register={register}/>
              Already have an account?
              <button onClick={()=>{setHasAccount(true)}}>Log In</button>
            </div>
          }
        </> 
        : <div className='logout'>
          { auth.firstname }
          <button onClick={ logout }>Logout </button>
        </div>
      }

      {msg && <DialogBox msg={msg} setMsg={setMsg}/>}

      <ul className='products'>
        {
          products.map( product => {
            const isInCart = cart.find(item => item.product_id === product.id);
            return (
              <li key={ product.id }>
                <div  className={ isInCart ? 'favorite': 'least-favorite'}>
                  <div>{ product.title }</div>
                  <div>
                    {
                      auth.id && isInCart && <button onClick={()=> removeFromCart(product.id)}>remove</button>
                    }
                    {
                      auth.id && !isInCart && <button onClick={()=> addToCart(product.id)}>add</button>
                    }
                  </div>
                </div>
              </li>
            );
          })
        }
      </ul>
    </>
  )
}

export default App
