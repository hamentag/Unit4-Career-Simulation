
import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";

import Products from './components/Products'
import SingleProduct from './components/SingleProduct';
import Cart from './components/Cart';
import Account from './components/Account';

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
                <p>{msg.txt}</p>
                <div>{msg.more}</div>                
            </div>
            <button onClick={()=>{setMsg(null)}} style={{fontSize:'18px'}}> &times; </button>
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

  const navigate = useNavigate();
  const location = useLocation();

  
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
        console.error(response.error);
        setMsg("Oops! unable to fetch product list currently.")            
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

  const addToCart = async(product_id, qty)=> {
    console.log(qty)
    const response = await fetch(`/api/users/${auth.id}/cart`, {
      method: 'POST',
      body: JSON.stringify({ product_id, qty}),
      headers: {
        'Content-Type': 'application/json',
        authorization: window.localStorage.getItem('token')
      }
    });
    const json = await response.json();
    if(response.ok){
      setCart([...cart, json]);
      console.log(location.pathname)
      setMsg({
        txt: "Product has been successfully added to your cart.",
        more: <div>qty: {qty}
          <button onClick={()=>{navigate('/cart'); setMsg(null)}}>Check Cart</button>
          <button onClick={()=>{setMsg(null)}}>Continue Shopping</button>
        </div>
      });
    }
    else {
      console.error(json.error);
      setMsg({
        txt: json.error,
        more: <button onClick={()=>{setMsg(null)}}>OK</button>
      })

    }
  };

  const removeFromCart = async(id)=> {
    const response = await fetch(`/api/users/${auth.id}/cart/${id}`, {
      method: 'DELETE',
      headers: {
        authorization: window.localStorage.getItem('token')
      }
    });
    if(response.ok){
      setCart(cart.filter(item => item.product_id !== id));
      setMsg({
        txt: "Product has been successfully removed from your cart.",
        more: <button onClick={()=>{setMsg(null)}}>OK</button>
      })
    }
   
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
      setMsg({
        txt: "Incorrect email or password. Please try again."
      })
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
      setMsg({
        txt: "Success! Your account has been created.",
        more: <button onClick={()=>{navigate('/account'); setMsg(null)}}>See Account</button>
      });
      login({ email: newUserData.email, password: newUserData.password });  
    }
    else{
      console.error(result.error);
      setMsg({
        txt: "Account creation failed with provided information."
      });
    }
  };

  const logout = ()=> {
    window.localStorage.removeItem('token');
    setAuth({});
  }

  return (
    <>
      <div  className='site-Title'>
        <h1><Link to={'/'}>ElectroCenter</Link></h1>
      </div>
      { auth.id &&
        <div>
         <h3><Link to={'/cart'}>cart</Link></h3>
        </div>
      }
     
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

      <Routes>
        <Route path="/" element={<Products auth={auth} cart={cart} setMsg={setMsg} 
          addToCart={addToCart} removeFromCart={removeFromCart} products={products} />} 
        />
        <Route path="/:id" element={<SingleProduct auth={auth} cart={cart} setMsg={setMsg} 
          addToCart={addToCart} removeFromCart={removeFromCart} />} 
        />
        <Route path="/cart" element={<Cart auth={auth} cart={cart} setCart={setCart} products={products}setMsg={setMsg} 
          addToCart={addToCart} removeFromCart={removeFromCart} />} 
        />
        <Route path="/account" element={<Account auth={auth} cart={cart} products={products}setMsg={setMsg} 
          addToCart={addToCart} removeFromCart={removeFromCart} />} 
        />
        
      </Routes>

    </>
  )
}

export default App
