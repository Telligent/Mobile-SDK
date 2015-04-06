using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Telligent.Evolution.Mobile.PushNotifications.Model
{
	[Flags]
	internal enum DeviceType
	{
		None = 0,
		Android = 1,
		IOS = 2
	}
}
