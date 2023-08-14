const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;


//User Schema
const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{ dateTime: Date, userAgent: String }],
});

let User; // to be defined on new connection 

module.exports.initialize=()=>{
    return new Promise((resolve, reject) => {
        const db = mongoose.createConnection("mongodb+srv://Simran:<Simran@123>@atlascluster.kftfm6m.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});
    
        db.on("error", (err) => {
          reject(err);
        });
    
        db.once("open", () => {
          User = db.model("users", userSchema);
          resolve();
        });
      });
}

module.exports.registerUser=(userData)=>{
    return new Promise((resolve, reject) => {
        const { password, password2 } = userData;
        if (password !== password2) {
          return reject("Passwords do not match");
        }
        bcrypt.hash(userData.password, 10).then((hash) => {
            userData.password = hash;
            let newUser = new User(userData);
            newUser.save().then(() => 
               resolve())
              .catch((err) => {
                if (err.code === 11000) {
                  return reject("User Name already taken");
                }
                return reject(`There was an error creating the user: ${err}`);
              });
          })
          .catch(() =>reject("There was an error encrypting the password"));
      });
}

module.exports.checkUser=(userData)=>{
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
          .then((users) => {
            if (users.length < 1) {
              return reject(`Unable to find user: ${userData.userName}`);
            }
            const user = users[0];
            bcrypt.compare(userData.password, user.password).then((result) => {
              if (result === false) {
                return reject(`Incorrect Password for user: ${userData.userName}`);
              }
              User.updateOne(
                { userName: userData.userName },
                {
                  $set: {
                    loginHistory: user.loginHistory.concat({
                      dateTime: new Date().toString(),
                      userAgent: userData.userAgent,
                    }),
                  },
                }
              )
                .then(() => resolve(user))
                .catch((err) =>
                  reject(`There was an error verifying the user: ${err}`)
                );
            });
          })
          .catch(() => reject(`Unable to find user: ${userData.userName}`));
      });
}
