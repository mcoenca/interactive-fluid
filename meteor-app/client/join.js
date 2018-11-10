import { colorInfos } from '/imports/MainColorInfos.js';



Template.Join_page.helpers({
  colorInfos() {
    return colorInfos;
  },
  path(colorInfo) {
    console.log(colorInfo);
    return FlowRouter.path('Color', colorInfo);
  }
});
