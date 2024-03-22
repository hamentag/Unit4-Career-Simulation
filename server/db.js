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
      firstname VARCHAR(40),
      lastname VARCHAR(40),
      email VARCHAR(155) UNIQUE NOT NULL,
      password VARCHAR(155) NOT NULL,
      phone VARCHAR(25) NOT NULL,
      is_admin BOOLEAN DEFAULT false NOT NULL,
      is_engineer BOOLEAN DEFAULT false NOT NULL
    );
    CREATE TABLE products(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(25) UNIQUE NOT NULL,
      price NUMERIC NOT NULL,
      description VARCHAR(155) UNIQUE NOT NULL,
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
            RAISE EXCEPTION 'Cart quantity cannot exceed inventory';
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

const createProduct = async({ name, price, description, inventory })=> {
  const SQL = `
    INSERT INTO products(id, name, price, description, inventory) VALUES($1, $2, $3, $4, $5 ) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name, price, description, inventory]);
  return response.rows[0];
};

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
  return { token };
};

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

module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  fetchUsers,
  fetchProducts,
  fetchCartProducts,
  addToCart,
  authenticate
};
