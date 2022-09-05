const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.set("view engine", "ejs"); // to set up EJS, and "npm i ejs"

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_DB_URL);

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Become a Full Stack Engineer",
});

const item2 = new Item({
  name: "Become a Front-End Engineer",
});

const item3 = new Item({
  name: "Become a Back-end Engineer",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({}, (err, docs) => {
    if (docs.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log("Successfully saved deafault items into DB!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: docs }); //res.render part of EJS, look at docs
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem; // to access the form input value of name newItem
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted!");
        res.redirect("/");
      }
    });
  } else {
    // List.findOne({name: listName}, (err, foundList) => {
    //   foundList.items.pull({_id: checkedItemId});
    //   foundList.save();
    //   res.redirect("/" + listName);
    // })
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

// Dynamic Route
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Create New List
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", (req, res) => {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
