const Group = require("../Models/Group");
const User = require("../Models/User");
const Sent = require("../Models/Sent");
const Template = require("../Models/Template");
const bcrypt = require("bcrypt");
const { sendMail } = require("../services/mail");
const generateToken = require("../utils/generateToken");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET

const addGroup = async (req, res) => {
  const group = new Group({
    name: req.body.name,
    emails: req.body.emails,
    userId: req.user._id,
  });
  if (!group)
    return res
      .status(400)
      .send({ success: false, message: "Failed to add group" });
  const result = await group.save();
  if (!result)
    return res
      .status(400)
      .send({ success: false, message: "Failed to add group" });
  res
    .status(200)
    .send({ success: true, message: "Successfully added the group" });
};

const viewGroups = async (req, res) => {
  const groups = await Group.find({ userId: req.user._id });
  if (!groups)
    return res.status(500).send({ success: false, message: "No groups found" });
  res
    .status(200)
    .send({ success: true, message: "successfully fetched the data.", groups });
};

const sendMails = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    let temp = "none";
    const group = await Group.findById(req.body.group);
    if (req.body.template !== "none") {
      temp = await Template.findById(req.body.template);
    } else {
      temp = "none";
    }

    if (!group) {
      console.log("Group not found:", req.body.group);
      return res.status(404).send({ success: false, message: "Group not found" });
    }

    const msg = req.body.message || " ";
    const template = temp !== "none" ? temp.content : " ";
    const sendSuccess = await sendMail(group.emails, req.body.subject, msg, template);

    const sendBox = new Sent({
      userId: req.user._id,
      subject: req.body.subject,
      groupId: req.body.group,
      message: req.body.template !== "none" ? temp.name : "Custom message",
    });

    const result = await sendBox.save();
    if (!result) {
      console.log("Failed to add send record.");
      return res.status(500).send({ success: false, message: "Failed to add send record" });
    }

    res.status(200).send({ success: true, message: "Successfully sent" });
  } catch (error) {
    console.error("Error in sendMails:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
};



const deleteGroup = async (req, res) => {
  const group = await Group.findByIdAndDelete(req.params.id);
  if (!group)
    return res
      .status(404)
      .send({ success: false, message: "Failed to delete the group" });
  res
    .status(200)
    .send({ success: true, message: "Group deleted successfully" });
};

const register = async (req,res) => {
  try{
     //get the user inputs from the request body
     const {name, email, password} = req.body;

     //check if the user aleady exists in the database
     const user = await User.findOne({email});

     //if the use already exists, return an error
     if(user){
         return res.status(400).send({message : 'User already exists'});
     }
      //hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

     //create a new user
     const newUser = new User({name,email,password: hashedPassword });

     //save the user to the database
     const savedUser = await newUser.save();

     //return the user
     res.status(201).send({message :'User created successfully'});

  }catch(error){
     res.send({message : error.message})
  }
};

const login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res
      .status(400)
      .send({ success: false, message: "Incorrect password or email" });
  if (!bcrypt.compareSync(req.body.password, user.password))
    return res
      .status(400)
      .send({ success: false, message: "Invalid username or password" });
  const token = generateToken(user.email);
  res.status(200).send({
    success: true,
    message: "Successfully loggedIn",
    token,
  });
};

const logout = async (req,res) =>{
  try{
      const userId = req.userId;

      //if user does not logged in
      if(!userId){
          return res.status(400).send({message: 'User not logged in'});
      }

      //clear the cookie
      res.clearCookie('token');

      //return the user
      res.status(200).send({message : 'Logout successful'});

  }catch(error){
      res.send({message : error.message})
  }
};

const sentDetails = async (req, res) => {
  const mails = await Sent.find({ userId: req.user._id }).populate({
    path: "groupId",
    select: "name",
  });

  if (!mails)
    return res.status(404).send({ success: false, message: "Mails not found" });
  res.send({ success: true, message: "Successfully fetched the data", mails });
};

const newTemplate = async (req, res) => {
  const template = new Template({
    userId: req.user._id,
    content: req.body.content,
    name: req.body.name,
  });
  if (!template)
    return res
      .status(500)
      .send({ success: false, message: "Failed creation of template" });
  const result = await template.save();
  if (!result)
    return res
      .status(500)
      .send({ success: false, message: "Failed creation of template" });
  res
    .status(200)
    .send({ success: true, message: "successfully added new template" });
};

const deleteTemplate = async (req, res) => {
  const template = await Template.findByIdAndDelete(req.params.id);
  if (!template)
    return res
      .status(404)
      .send({ success: false, message: "Template not found!" });
  res
    .status(200)
    .send({ success: true, message: "Template successfully deleted" });
};

const viewTemplates = async (req, res) => {
  const templates = await Template.find({ userId: req.user._id });
  if (!templates)
    return res
      .status(500)
      .send({ success: false, message: "Cannot fetch the templates!" });
  res.status(200).send({
    success: true,
    message: "Templates fetched successfully",
    templates,
  });
};

const dashboard = async (req, res) => {
  const groups = await Group.find({ userId: req.user._id });
  const templates = await Template.find({ userId: req.user._id });
  const sents = await Sent.find({ userId: req.user._id });
  res.status(200).send({
    success: true,
    message: "Successfully fetched the data",
    groups: groups.length,
    templates: templates.length,
    sents: sents.length,
  });
};

module.exports = {
  addGroup,
  sendMails,
  viewGroups,
  deleteGroup,
  register,
  login,
  logout,
  sentDetails,
  newTemplate,
  deleteTemplate,
  viewTemplates,
  dashboard,
};