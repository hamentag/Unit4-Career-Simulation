import { useState, useEffect } from "react";

import { useParams, Link, useNavigate } from "react-router-dom";

export default function SingleProduct({auth, cart, setMsg, addToCart, removeFromCart}){

    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [error, setError] = useState(null);
    
    useEffect(()=> {
        const fetchSingleProduct = async()=> {
          const response = await fetch(`/api/products/${id}`);
          const json = await response.json();
          console.log(json)
          if(response.ok){
            setProduct(json);
          }
          else{
            console.error(response.error);
            setMsg("Oops Something went wrong.")            
          }
        };
        fetchSingleProduct();
      }, []);

      return(
        <>
            <div className="product-details"> 
                {product &&
                    <>
                        <h3>Product Details "{product.title}"</h3>
                        <table>
                            <tbody>
                                <tr>
                                    <th scope="row">Title</th>
                                    <td>{product.title}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Category</th>
                                    <td>{product.category}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Price</th>
                                    <td>${product.price}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Dimensions</th>
                                    <td>{product.dimensions}</td>
                                </tr>
                                <tr>
                                    <th scope="row">characteristics</th>
                                    <td>{product.characteristics}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Inventory</th>
                                    <td>{product.inventory}</td>
                                </tr>
                            </tbody>
                        </table>
                    </>
                }
            
            </div>
        </>
      )
}