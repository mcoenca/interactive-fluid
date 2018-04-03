import ably from 'ably'
const realtime = new ably.Realtime('P6TapA.DpvyQg:xpEbBUNQPVRdd9Va');
export const streamChannel = realtime.channels.get('streamEvents');

export default {streamChannel}
