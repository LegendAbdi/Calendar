const express = require('express');
const multer = require('multer');
const mustacheExpress = require('mustache-express');
const ical = require('node-ical');
const bodyParser = require('body-parser');
const path = require('path');
const { client, db } = require('./db');

const app = express();
const session = require('express-session');
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(session({
  secret: 'asdklfja;oerighaepro',  // A secret key for signing the session ID cookie
  resave: false,              // Forces the session to be saved back to the session store
  saveUninitialized: true,    // Forces a session that is "uninitialized" to be saved to the store
  cookie: { secure: false }    // Use secure cookies if you are using HTTPS, otherwise set it to false
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/features', (req, res) => {
  res.sendFile(path.join(__dirname, 'features.html'));
});

app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'support.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'success.html'));
});

app.get('/error', (req, res) => {
  res.sendFile(path.join(__dirname, 'error.html'));
});

app.get('/signupError', (req, res) => {
  res.sendFile(path.join(__dirname, 'signupError.html'));
});

app.get('/friendError', (req, res) => {
  res.sendFile(path.join(__dirname, 'friendError.html'));
});

app.get('/schedule', (req, res) => {
  res.sendFile(path.join(__dirname, 'schedule.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload.html'));
});

app.get('/friends', (req, res) => {
  res.sendFile(path.join(__dirname, 'friends.html'));
});

app.get('/scheduleDetails', async (req, res) => {
  if (!req.session.username){
    res.redirect('/error')
  }

  await client.connect();
  const usersCollection = db.collection('user_info');
  const { date, title, uid } = req.query;

  data = await usersCollection.findOne({username: req.session.username, [`schedule.${uid}.uid`]: uid})
  notes = data.schedule[uid].notes

  const dateObject = new Date(date);
  const formattedDate = `${dateObject.getMonth() + 1}-${dateObject.getDate()}-${dateObject.getFullYear()}`;

  res.render('scheduleDetails', { date: formattedDate, title: title, uid: uid, notes: notes });
});

app.get('/friendScheduleDetails', async (req, res) => {
  if (!req.session.username){
    res.redirect('/error')
  }

    await client.connect();
    const usersCollection = db.collection('user_info');
    const { date, title, uid, fusername } = req.query;

    data = await usersCollection.findOne({username: fusername})

    if (data == null){
      res.redirect('/friendError')
    }

    let scheduleObject = ""

    for (const eventId in data.schedule) {
      if (data.schedule[eventId].uid === uid) {
        scheduleObject = data.schedule[eventId];
      }
    }

    console.log(scheduleObject)
    notes = scheduleObject.notes

    const dateObject = new Date(date);
    const formattedDate = `${dateObject.getMonth() + 1}-${dateObject.getDate()}-${dateObject.getFullYear()}`;

    return res.render('friendScheduleDetails', { date:formattedDate, title:title, uid:uid, notes:notes });
  });

app.post('/signup', async (req, res) => {
        const { username, password, fullName, email, studentId, year } = req.body;
      
        try {
          await client.connect();

          const usersCollection = db.collection('user_info');
      
          // Check if the user already exists
          const existingUser = await usersCollection.findOne({ username });
          if (existingUser) {
            res.redirect('/signupError');
          }
      
          // Create a new user
          const newUser = {
            username,
            password,
            fullName,
            email,
            studentId,
            year,
            schedule: {},
            friends: {}
          };
      
          await usersCollection.insertOne(newUser);
      
          // res.status(201).json({ message: 'User created successfully.' });
          res.redirect('/success')
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Internal server error' });
        }
});

app.post('/login', async (req, res) => {
  const {username, password} = req.body;

  try {
    await client.connect();

    const usersCollection = db.collection('user_info');

    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ username: username, password: password });
    if (!existingUser) {
      res.redirect('/error')
    } else {
      req.session.username = username
      console.log(req.session.username)
      res.redirect('/schedule')
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/upload', upload.single('icsFile'), async (req, res) => {
  if (!req.session.username){
    res.redirect('/error')
  }
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;

  await client.connect();
  const usersCollection = db.collection('user_info');

  ical.parseFile(filePath, async function(err, data) {
    if (err) {
      console.error('Error parsing the .ics file:', err);
      return res.status(500).send('Error parsing the .ics file.');
    }

    try {
      // const jsonData = JSON.stringify(data, null, 2);

      cleanData = {}

      for (const key in data) {
        element = data[key]
        if (element.hasOwnProperty("uid")){
          uid = element["uid"].replace(".", "-")
          element["uid"] = uid
          cleanData[uid] = element
        }
      }

      await usersCollection.updateOne({username: req.session.username}, {$set: {schedule: cleanData}},{upsert:true})
      res.redirect('/schedule')

    } catch (jsonErr) {
      console.error('Error converting data to JSON:', jsonErr);
      return res.status(500).send('Error converting data to JSON.');
    }
  });
});

app.get('/getSchedule', async (req, res) => {
  if (!req.session.username){
    console.log("BS!!")
    return res.redirect('/')
  }
    await client.connect();
    const usersCollection = db.collection('user_info');
  
    user = await usersCollection.findOne({username: req.session.username})
    if (!user){
      return res.redirect('/error')
    }
    return res.json(user["schedule"])
  });

app.get('/friendSchedule', async (req, res) => {
  res.sendFile(path.join(__dirname, 'friendSchedule.html'));
});

app.get('/getFriendSchedule', async (req, res) => {
  if (!req.session.username){
    return res.redirect('/')
  }
    await client.connect();
    const usersCollection = db.collection('user_info');
  
    const { fusername } = req.query;
    console.log("this is fusername:", fusername)
  
    user = await usersCollection.findOne({username: fusername})
    if (!user){
      return res.redirect('/friendError')
    } else {
      return res.json(user["schedule"])
    }
});


app.post('/updateDetails', async (req, res) => {
  if (!req.session.username){
    res.redirect('/')
  }

  await client.connect();
  const usersCollection = db.collection('user_info');

  try {
    const {notes, uid} = req.body;
    data = {$set: {[`schedule.${uid}.notes`]: notes[0]}}
    console.log(uid)
    console.log(notes)
    console.log(data)
    await usersCollection.updateOne({username: req.session.username}, data,{upsert:true})
    res.redirect('/schedule')

  } catch (jsonErr) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

      
app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
});
