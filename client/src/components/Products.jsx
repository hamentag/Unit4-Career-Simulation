import { useState, useEffect } from "react";

import { useParams, Routes, Route, Link, useNavigate } from "react-router-dom";

export default function Products({auth, cart, setMsg, addToCart, removeFromCart, products}){
    
    const navigate = useNavigate();

    return (
        <ul className='products'>
        {
          products.map( product => {
            const isInCart = cart.find(item => item.product_id === product.id);
            return (
              <li key={ product.id }>
                <div  className={ isInCart ? 'favorite': 'least-favorite'}>
                  <h4>{ product.title }</h4>
                  <div>
                    <button onClick={() => {
                        navigate(`/${product.id}`);
                        }}>Details
                    </button>
                    {
                      auth.id && <button onClick={()=> { 
                        isInCart ? 
                            setMsg({
                                txt: "Product already in cart.", 
                                more: <div>
                                    <button onClick={()=>{navigate('/cart'); setMsg(null)}}>Check Cart</button>
                                    <button onClick={()=>{removeFromCart(product.id)}}>Remove</button>
                                </div>
                            })
                        : 
                        addToCart(product.id,1)

                    }}>add</button>
                    }
                   <div>qty: {
                     cart.find(item => product.id === item.product_id)? cart.find(item => product.id === item.product_id).qty: 0
                   }</div>
                   <div>inventory: {product.inventory}</div>
                  </div>
                </div>
              </li>
            );
          })
        }
      </ul>        
    )
}