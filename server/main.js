import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { streamChannel} from "../imports/MainStream";


Shapes = new Mongo.Collection('shapes');

Shapes.schema = new SimpleSchema({
  color: {type: String},
  events: {type: [Object]}
});


Meteor.publish('shapes.all', function () { 
  return Shapes.find({}, {_id: -1});
})

Meteor.startup(() => {
  Shapes.remove({});
});
