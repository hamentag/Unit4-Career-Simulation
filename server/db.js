const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/eCommerce_site_db');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT = process.env.JWT || 'shhh';

const createTables = async()=> {
  const SQL = `
    -- Create tables:
    DROP TABLE IF EXISTS users cascade;
    DROP TABLE IF EXISTS products cascade;
    DROP TABLE IF EXISTS cart_products cascade;
    CREATE TABLE users(
      id UUID PRIMARY KEY,
      firstname VARCHAR(40) NOT NULL,
      lastname VARCHAR(40) NOT NULL,
      email VARCHAR(155) UNIQUE NOT NULL,
      password VARCHAR(155) NOT NULL,
      phone VARCHAR(25),
      is_admin BOOLEAN DEFAULT false,
      is_engineer BOOLEAN DEFAULT false
    );
    CREATE TABLE products(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(35) UNIQUE NOT NULL,
      category VARCHAR(35) NOT NULL,
      price NUMERIC NOT NULL,
      dimensions VARCHAR(45) NOT NULL,
      characteristics VARCHAR(255) NOT NULL,
      inventory INTEGER NOT NULL
    );
    CREATE TABLE cart_products(
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      product_id UUID REFERENCES products(id) NOT NULL,
      qty INTEGER,
      CONSTRAINT unique_user_id_and_product_id UNIQUE (user_id, product_id) 
    );

    -- check constraint function to validate data before insert or update the cart quantity
    CREATE OR REPLACE FUNCTION check_cart_quantity_less_than_inventory()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (SELECT inventory FROM products WHERE id = NEW.product_id) < NEW.qty THEN
            RAISE EXCEPTION 'Oops! It seems you ve added more items to your cart than we have in stock.';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger to execute check constraint function
    CREATE TRIGGER check_cart_quantity_trigger
    BEFORE INSERT OR UPDATE ON cart_products
    FOR EACH ROW
    EXECUTE FUNCTION check_cart_quantity_less_than_inventory();
  `;
  
  await client.query(SQL);
};

const createUser = async({ firstname, lastname, email, phone, password, is_admin, is_engineer})=> {
  const SQL = `
    INSERT INTO users(id, firstname, lastname, email, phone, password, is_admin, is_engineer) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), firstname, lastname, email, phone, await bcrypt.hash(password, 5), is_admin, is_engineer]);
  return response.rows[0];
};

const createProduct = async({ title, category, price, dimensions, characteristics, inventory })=> {
  const SQL = `
    INSERT INTO products(id, title, category, price, dimensions, characteristics, inventory) VALUES($1, $2, $3, $4, $5, $6, $7 ) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), title, category, price, dimensions, characteristics, inventory]);
  return response.rows[0];
};

// const addToCart = async({ user_id, product_id })=> {
//   const SQL = `
//     INSERT INTO cart_products(id, user_id, product_id, qty) VALUES($1, $2, $3, $4) RETURNING *
//   `;
//   const response = await client.query(SQL, [uuid.v4(), user_id, product_id, 1]);
//   return response.rows[0];
// };


// incrementPrdCart

// update (para + 0r -)


const addToCart = async({ user_id, product_id, qty })=> {
  const SQL = `
    -- PostgreSQL upsert feature: "Update the quantity of a product if it exists 
    -- in the cart; otherwise, insert a new one." 
    INSERT INTO cart_products (id, user_id, product_id, qty)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT(user_id, product_id) 
    DO UPDATE SET
      qty = EXCLUDED.qty
    RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, product_id, qty]);
  return response.rows[0];
};



const deleteCartProduct = async({ user_id, id })=> {
  const SQL = `
    DELETE FROM cart_products WHERE user_id=$1 AND product_id=$2
  `;
  await client.query(SQL, [user_id, id]);
};

const authenticate = async({ email, password })=> {
  const SQL = `
    SELECT id, password
    FROM users
    WHERE email = $1
  `;
  const response = await client.query(SQL, [ email ]);
  if(!response.rows.length || (await bcrypt.compare(password, response.rows[0].password))=== false){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id}, JWT);
  return { token }; //
};


const findUserWithToken = async(token) => {
  let id;
  try {
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
  }
  catch(ex){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const SQL = `
    SELECT id, firstname, lastname, email, phone, is_admin, is_engineer
    FROM users
    WHERE id = $1
  `;
  const response = await client.query(SQL, [id]);
  if(!response.rows.length){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  return response.rows[0];

}

const fetchUsers = async()=> {
  const SQL = `
    SELECT * FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchProducts = async()=> {
  const SQL = `
    SELECT * FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchCartProducts = async(user_id)=> {
  const SQL = `
    SELECT * FROM cart_products where user_id = $1
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};

const fetchSingleProduct = async(id) =>{
  const SQL = `
    SELECT * FROM products where id = $1
  `;
  const response = await client.query(SQL, [id]);
  return response.rows[0];
};


module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  fetchUsers,
  fetchProducts,
  fetchCartProducts,
  addToCart,
  deleteCartProduct,
  authenticate,
  findUserWithToken,
  fetchSingleProduct
};
