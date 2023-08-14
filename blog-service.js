const Sequelize = require('sequelize');

var sequelize = new Sequelize('ezntvkwa','ezntvkwa','FWMXdLfpcQbz_l7_wxS3qJrBb-jQmFvt',{
    host: 'bubble.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: {rejectUnauthorized:false}
    },
    query:{raw:true}
});

const Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
  });
  
const Category = sequelize.define('Category', {
    category: Sequelize.STRING,
  });
  
  Post.belongsTo(Category, { foreignKey: "category" });

module.exports.initialize=()=>{
  return new Promise((resolve,reject)=>{
    sequelize
    .sync()
    .then(()=>{resolve();})
    .catch(()=>{reject('unable to sync the database');})
  });
}
module.exports.getAllPosts = () =>{
    return new Promise((resolve,reject)=>{
        Post.findAll()
        .then((data)=>{resolve(data);})
        .catch(()=>{reject('no results returned');});
    });
}

module.exports.getPostByCategory = (category) =>{
    return new Promise((resolve,reject)=>{
        Post.findAll({
            where: {
                cateogry: Number(category),
            }     
        })
        .then((data)=>{resolve(data);})
        .catch(()=>{reject('no results returned');});
      });
}

module.exports.getPostsByMinDate=(minDateStr) =>{
    return new Promise((resolve,reject)=>{
        Post.findAll({
            where: {
                postDate: {
                    [Op.gte]: new Date(minDateStr)
                }
            }
        })
        .then((data)=>{resolve(data);})
        .catch(()=>{reject('no results returned')});
    });
}

module.exports.getPostById = (id) =>{
    return new Promise((resolve,reject)=>{
        Post.findAll({
            where: {
                id: Number(id),
            }
        })
        .then((data)=>{resolve(data);})
        .catch(()=>{reject('no results returned');})
    });
}

module.exports.addPost = (postData) =>{ 
    return new Promise((resolve, reject) => {
        postData.published = Boolean(postData.published);
        postData.postDate = new Date();
        for (const item in postData) {
            if (typeof item === "string" && item.length === 0) {
                postData[item] = null;
            }
        }
        Post.create(postData)
        .then(() => resolve())
        .catch(() => reject("Unable to create post"));
    });
}

module.exports.getPublishPosts = () =>{
    return new Promise((resolve,reject)=>{
        Post.findAll({
            where: {
                published: true,
            }
        })
        .then((data)=>{resolve(data);})
        .catch(()=>{reject('no results returned')});
    });
}

module.exports.getPublishedpostsByCategory = (category) =>{
    return new Promise((resolve, reject) => {
        Post.findAll({ where: { published: true, category: Number(category) } })
          .then((data) => resolve(data))
          .catch(() => reject("No results returned"));
      });
}

module.exports.getCategories = () => {
    return new Promise((resolve,reject)=>{
        Category.findAll()
        .then((data)=>{resolve(data);})
        .catch(()=>reject('no results returned'));
      });
}

module.exports.addCategory = (categoryData) => {
    return new Promise((resolve, reject) => {
      for (const item in categoryData) {
        if (typeof item === "string" && item.length === 0) {
          categoryData[item] = null;
        }
      }
      Category.create(categoryData)
        .then(() => resolve())
        .catch(() => reject("No category created"));
    });
  };
  
  module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
      Category.destroy({ where: { id } })
        .then((destroyed) => {
          if (destroyed > 0) {
            resolve();
          } else {
            reject("No Category");
          }
        })
        .catch(() => reject("No Category"));
    });
  };
  
  module.exports.deletePostById = (id) => {
    return new Promise((resolve, reject) => {
      Post.destroy({ where: { id } })
        .then((destroyed) => {
          if (destroyed > 0) {
            resolve();
          } else {
            reject("No Category");
          }
        })
        .catch(() => reject("No Category"));
    });
  };
