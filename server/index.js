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

    const dmData = await Promise.all([
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


      // createProduct({ title: 'Printer', price: 15, description: "some descr.. foo", inventory:37 }),
      // createProduct({ title: 'Laptop', price: 11, description: "some descr.. bar", inventory:37 }),
      // createProduct({ title: 'Smartphone', price: 12, description: "some descr.. bazz", inventory:38 }),
      // createProduct({ title: 'Keyboard', price: 9, description: "some descr.. quq", inventory:39 }),
      // createProduct({ title: 'Mouse', price: 21, description: "some descr.. fip", inventory:40 })


    createProduct({ title: 'NovaTech Nexus X', category: 'Smartphone',  price: 799.99, dimensions: '5.8 x 2.8 x 0.3', characteristics: '6.4" Super AMOLED display, Snapdragon 888 processor, 128GB storage, 12MP dual camera, 5G connectivity', inventory:37 }),
    createProduct({ title: 'QuantumTech Quantum Q', category: 'Smartphone',  price: 899.99, dimensions: '6.1 x 3.0 x 0.4', characteristics: '6.7" OLED display, Quantum processor, 256GB storage, 108MP triple camera, 5G connectivity', inventory:36 }),
    createProduct({ title: 'AstroGlide StellarPhone', category: 'Smartphone', price: 749.99, dimensions: '6.0 x 3.2 x 0.3', characteristics: '6.2" LCD display, AstroCore processor, 64GB storage, 16MP dual camera, 4G connectivity', inventory:27 }),
    


    createProduct({ category: 'Laptop', title: 'QuantumBook Pro', price: 1499.99, dimensions: '14.1 x 9.6 x 0.7', characteristics: 'Intel Core i7 processor, 16GB RAM, 512GB SSD, 15.6" FHD display, Windows 11', inventory:38 }),
    createProduct({ category: 'Laptop', title: 'HyperTech Hyperbook Elite', price: 1299.99, dimensions: '13.9 x 8.8 x 0.6', characteristics: 'AMD Ryzen 9 processor, 32GB RAM, 1TB SSD, 14" QHD display, NVIDIA RTX 3060 graphics', inventory:37 }),
    createProduct({ category: 'Laptop', title: 'NeoFlex UltraBook Pro', price: 999.99, dimensions: '12.8 x 8.5 x 0.6', characteristics: 'Intel Core i5 processor, 8GB RAM, 256GB SSD, 13.3" HD display, Backlit keyboard', inventory:37 }),
    // Tablet
    createProduct({ category: 'Tablet', title: 'HyperTab Vision', price: 499.99, dimensions: '9.4 x 6.2 x 0.3', characteristics: '10.1" IPS display, MediaTek Helio processor, 64GB storage, 6000mAh battery, Android 12', inventory:37 }),
    createProduct({ category: 'Tablet', title: 'PowerTab ProTouch', price: 599.99, dimensions: '10.2 x 7.5 x 0.4', characteristics: '11" AMOLED display, Qualcomm Snapdragon processor, 128GB storage, 8000mAh battery, Stylus included', inventory:37 }),
    createProduct({ category: 'Tablet', title: 'VortexPad SuperTab', price: 399.99, dimensions: '8.5 x 5.9 x 0.2', characteristics: '9.7" TFT display, Exynos processor, 32GB storage, 5000mAh battery, Wi-Fi connectivity', inventory:37 }),
   
     // Desktop Computer
     createProduct({ category: 'Desktop Computer', title: 'StellarTech Horizon', price: 1999.99, dimensions: '17.3 x 8.7 x 18.9', characteristics: 'Intel Core i9 processor, 32GB RAM, 1TB SSD + 2TB HDD, NVIDIA RTX 3080 graphics, Liquid cooling system', inventory:37 }),
     createProduct({ category: 'Desktop Computer', title: 'CoreFusion MaxTower', price: 1799.99, dimensions: '16.5 x 7.9 x 19.3', characteristics: 'AMD Ryzen 7 processor, 16GB RAM, 512GB SSD + 1TB HDD, AMD Radeon RX 6800 graphics', inventory:37 }),
     createProduct({ category: 'Desktop Computer', title: 'TitanTech PowerStation', price: 2499.99, dimensions: '18.1 x 8.3 x 20.5', characteristics: 'Intel Core i9 processor, 64GB RAM, 2TB SSD + 4TB HDD, NVIDIA RTX 3090 graphics, RGB lighting', inventory:37 }),
     // Television (TV)
     createProduct({ category: 'Television (TV)', title: 'UltraView CrystalClear', price: 1499.99, dimensions: '55"', characteristics: '4K Ultra HD resolution, Dolby Vision, HDR10, Smart TV with voice control, 120Hz refresh rate', inventory:37 }),
     createProduct({ category: 'Television (TV)', title: 'VisionTech QuantumView', price: 1999.99, dimensions: '65"', characteristics: '8K Ultra HD resolution, Quantum HDR, Dolby Atmos, Built-in streaming apps, Ambient mode', inventory:37 }),
     createProduct({ category: 'Television (TV)', title: 'UltraVision ProMax', price: 999.99, dimensions: '50"', characteristics: 'Full HD resolution, HDR, DTS Sound, Chromecast built-in, HDMI and USB ports', inventory:37 }),
     // Gaming Console
     createProduct({ category: 'Gaming Console', title: 'ArcaneX PlaySphere', price: 499.99, dimensions: '50"', characteristics: '4K gaming, SSD storage, Backward compatibility, Xbox Game Pass subscription, Wireless controller', inventory:37 }),
     createProduct({ category: 'Gaming Console', title: 'PulseX GamingSphere', price: 449.99, dimensions: '50"', characteristics: '1440p gaming, Ray tracing support, PlayStation Now subscription, DualSense controller, VR compatibility', inventory:37 }),
     createProduct({ category: 'Gaming Console', title: 'TitanGamer MaxPlay', price: 599.99, dimensions: '50"', characteristics: '8K gaming, High frame rates, Nintendo Switch Online subscription, Joy-Con controllers, Docking station', inventory:37}),
     // Audio Equipment
     createProduct({ category: 'Audio Equipment', title: 'SonicWave Elite Earbuds', price: 149.99, dimensions: '50"', characteristics: 'True wireless design, Active noise cancellation, Bluetooth 5.2, IPX7 water resistance, Touch controls', inventory:37 }),
     createProduct({ category: 'Audio Equipment', title: 'BeatWave SonicPods', price: 99.99, dimensions: '50"', characteristics: 'Wireless earbuds, Passive noise isolation, Bluetooth 5.0, Sweatproof design, Compact charging case' , inventory:37}),
     createProduct({ category: 'Audio Equipment', title: 'HarmoniTech HarmonySound', price: 249.99, dimensions: '50"', characteristics: 'Wireless over-ear headphones, Hi-Fi sound, ANC, Bluetooth 5.1, 40-hour battery life, Foldable design' , inventory:37}),
    
  
    // Camera
    createProduct({ category: 'Camera', title: 'VisionMax UltraShot', price: 799.99, dimensions: '-', characteristics: '24MP APS-C sensor, 4K video recording, 5-axis image stabilization, Wi-Fi and NFC connectivity' , inventory:37}),
    createProduct({ category: 'Camera', title: 'PixelPro LensMaster', price: 599.99, dimensions: '-', characteristics: '12MP full-frame sensor, 1080p video recording, 3-axis image stabilization, Compact and lightweight', inventory:37 }),
    createProduct({ category: 'Camera', title: 'VisionTech CaptureCam', price: 399.99, dimensions: '-', characteristics: '20MP 1-inch sensor, 4K time-lapse recording, Built-in GPS, Waterproof and shockproof design', inventory:37 }),
    // Smart Speaker
    createProduct({ category: 'Smart Speaker', title: 'EchoPulse SmartHome Hub', price: 99.99, dimensions: '-', characteristics: 'Alexa voice assistant, Smart home control hub, 360-degree sound, Zigbee and', inventory:37 }),
    createProduct({ category: 'Smart Speaker', title: 'SmartLink VoiceEcho', price: 129.99, dimensions: '-', characteristics: 'Google Assistant, Multi-room audio, Hands-free calling, Wi-Fi and Bluetooth connectivity', inventory:37 }),
    createProduct({ category: 'Smart Speaker', title: 'EchoTech SoundSphere', price: 79.99, dimensions: '-', characteristics: 'Compact design, Alexa integration, 360-degree sound, Built-in smart home hub', inventory:37 }),
    // Smartwatch
    createProduct({ category: 'Smartwatch', title: 'ChronoTech TimeMaster', price: 299.99, dimensions: '-', characteristics: 'Circular AMOLED display, 2-week battery life, Heart rate monitor, GPS, Water-resistant', inventory:37 }),
    createProduct({ category: 'Smartwatch', title: 'WatchLink ProSync', price: 199.99, dimensions: '-', characteristics: 'Square OLED display, 1-week battery life, Fitness tracking, Notifications, Water-resistant', inventory:37 }),
    createProduct({ category: 'Smartwatch', title: 'CyberFit FlexiTrack', price: 149.99, dimensions: '-', characteristics: 'Rectangular LCD display, 10-day battery life, Step counter, Sleep tracking, Water-resistant', inventory:37 }), 


    ]);

  
    // const [adam, yasir, sara, mark, foo, bar, bazz, quq, fip] = 
    
    ;

    console.log(await fetchUsers());
    console.log(await fetchProducts());
  
    console.log(await fetchCartProducts(dmData[0].id));
    const someCart = await addToCart({ user_id: dmData[0].id, product_id: dmData[4].id, qty: 7 });
    console.log("Adam's cart:",someCart);
    console.log("fetchCartProducts: ", await fetchCartProducts(dmData[0].id));
    app.listen(port, ()=> console.log(`listening on port ${port}`));
  };
  
  init();
  