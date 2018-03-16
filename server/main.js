import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Shapes = new Mongo.Collection('shapes');

Shapes.schema = new SimpleSchema({
  color: {type: String},
  events : {type: [Object], optional: true},
  userId: {type: String, regEx: SimpleSchema.RegEx.Id, optional: true}
});

Meteor.startup(() => {
  // code to run on server at startup
});
