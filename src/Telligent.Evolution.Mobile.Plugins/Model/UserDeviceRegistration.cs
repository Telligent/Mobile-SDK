using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Telligent.Evolution.Mobile.PushNotifications.Model
{
	internal class UserDeviceRegistration
	{
		internal int UserId { get; set; }
		internal string Token { get; set; }
		internal DeviceType Type { get; set; }
	}
}
