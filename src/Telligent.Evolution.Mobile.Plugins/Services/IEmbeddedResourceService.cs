using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace Telligent.Evolution.Mobile.PushNotifications.Services
{
	internal interface IEmbeddedResourceService
	{
		string GetString(string path);
		Stream GetStream(string path);
	}
}
