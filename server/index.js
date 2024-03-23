const {
    client,
    createTables,
    createUser,
    createProduct,
    addToCart,
    fetchUsers,
    fetchProducts,
    fetchCartProducts,
    deleteCartProduct,
    authenticate,
    findUserWithToken
  } = require('./db');
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  //for deployment only
  const path = require('path');
  app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
  app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets'))); 
  
  
  const isLoggedIn = async(req, res, next)=> {
    try {
      req.user = await findUserWithToken(req.headers.authorization);
      next();
    }
    catch(ex){
      next(ex);
    }
  };
  
  app.post('/api/auth/login', async(req, res, next)=> {
    try {
      res.send(await authenticate(req.body));
    }
    catch(ex){
      next(ex);
    }
  });
  
  app.post('/api/auth/register', async(req, res, next)=> {
    try {
      res.send(await createUser(req.body));
    }
    catch(ex){
      next(ex);
    }
  });
  
  app.get('/api/auth/me', isLoggedIn, (req, res, next)=> {
    try {
      res.send(req.user);
    }
    catch(ex){
      next(ex);
    }
  });
  
  
  app.get('/api/users', async(req, res, next)=> {
    try {
      res.send(await fetchUsers());
    }
    catch(ex){
      next(ex);
    }
  });
  
  app.get('/api/users/:id/cart', isLoggedIn, async(req, res, next)=> {
    try {
      res.send(await fetchCartProducts(req.params.id));
    }
    catch(ex){
      next(ex);
    }
  });

  app.post('/api/users/:id/cart',  isLoggedIn,async(req, res, next)=> {
    try {
      res.status(201).send(await addToCart({ user_id: req.params.id, product_id: req.body.product_id, qty: req.body.qty}));
    }
    catch(ex){
      next(ex);
    }
  });
  
  app.delete('/api/users/:user_id/cart/:id', isLoggedIn, async(req, res, next)=> {
    try {
      await deleteCartProduct({user_id: req.params.user_id, id: req.params.id });
      res.sendStatus(204);
    }
    catch(ex){
      next(ex);
    }
  });
  
  app.get('/api/products', async(req, res, next)=> {
    try {
      res.send(await fetchProducts());
    }
    catch(ex){
      next(ex);
    }
  });
  
  app.use((err, req, res, next)=> {
    console.log(err);
    res.status(err.status || 500).send({ error: err.message ? err.message : err });
  });
  
  const init = async()=> {
    const port = process.env.PORT || 3000;
    await client.connect();
    console.log('connected to database');
  
    await createTables();
    console.log('tables created');
  
    const [adam, yasir, sara, mark, foo, bar, bazz, quq, fip] = await Promise.all([
      createUser({firstname: 'Adam', lastname: 'Ag', 
                  email:'adam@com', phone: '6151328764', password: 'adam_pw', 
                  is_admin: false, is_engineer: false}),
      createUser({firstname: 'Yasir', lastname: 'Atg', 
                  email:'yasir@com', phone: '6291382734', password: 'yasir_pw', 
                  is_admin: true, is_engineer: false}),
      createUser({firstname: 'Sara', lastname: 'Bard', 
                  email:'sara@com', phone: '2151382121', password: 'sara_pw', 
                  is_admin: false, is_engineer: false}),
      createUser({firstname: 'Mark', lastname: 'Bragg', 
                  email:'mark@com', phone: '239138212', password: 'mark_pw', 
                  is_admin: false, is_engineer: true}),


        // { name, price, description, inventory }


      createProduct({ name: 'foo', price: 15, description: "some descr.. foo", inventory:37 }),
      createProduct({ name: 'bar', price: 11, description: "some descr.. bar", inventory:37 }),
      createProduct({ name: 'bazz', price: 12, description: "some descr.. bazz", inventory:38 }),
      createProduct({ name: 'quq', price: 9, description: "some descr.. quq", inventory:39 }),
      createProduct({ name: 'fip', price: 21, description: "some descr.. fip", inventory:40 })
    ]);

    console.log(await fetchUsers());
    console.log(await fetchProducts());
  
    console.log(await fetchCartProducts(adam.id));
    const someCart = await addToCart({ user_id: adam.id, product_id: foo.id, qty: 7 });
    console.log("Adam's cart:",someCart);
    console.log("fetchCartProducts: ", await fetchCartProducts(adam.id));
    app.listen(port, ()=> console.log(`listening on port ${port}`));
  };
  
  init();
  