export const getRevokeTip = message => {
  let name = '你'
  let revoker = message.revoker
  if (revoker === WKApp.loginInfo.uid) {
    if (revoker !== message.fromUID) {
      let memberFromName = '--'
      if (message.from) {
        memberFromName = message.from.title
      } else {
        WKSDK.shared().channelManager.fetchChannelInfo(
          new Channel(message.fromUID, ChannelTypePerson)
        )
      }
      return `${name}撤回了成员“${memberFromName}”的一条消息`
    }
    return `${name}撤回了一条消息`
  } else {
    const channel = new Channel(revoker ?? '', ChannelTypePerson)
    let channelInfo = WKSDK.shared().channelManager.getChannelInfo(
      new Channel(revoker ?? '', ChannelTypePerson)
    )
    if (channelInfo) {
      name = channelInfo.title
    } else {
      WKSDK.shared().channelManager.fetchChannelInfo(channel)
      name = '--'
    }
    if (revoker !== message.fromUID) {
      return `${name}撤回了一条成员消息`
    }
    return `${name}撤回了一条消息`
  }
}

export const getFlameTip = () => {
  return '[此消息为阅后即焚消息，请在手机端查看]'
}
