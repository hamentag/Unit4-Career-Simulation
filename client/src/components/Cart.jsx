import { useState, useEffect } from "react";

import { useParams, Link, useNavigate } from "react-router-dom";

export default function Cart({auth, cart,products, setMsg, addToCart, removeFromCart}){
    const { id } = useParams();



    return(
    <>
        {
            cart && 
            <ul>
        {
            cart.map(item => {
                const myProduct = products.find(product => product.id === item.product_id);
                
                return <li key={item.id}>
                    <h4>{myProduct.title}</h4>  
                    <div>Qty: {item.qty}</div>
                    <div>
                        <p>{myProduct.characteristics}.</p>
                        <div>{myProduct.dimensions}</div>
                        <div>{myProduct.inventory > 0? <p>In Stock</p>: <p>Out of Stock</p>}</div>
                        <div>Inventory: {myProduct.inventory}</div>
                       
                       
                    </div>
                    <div></div>
                    
                </li>                                       
            })
        }
        </ul>
        }
    </>
    )
}