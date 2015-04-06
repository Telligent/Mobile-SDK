using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace Telligent.Evolution.Mobile.PushNotifications.Implementations
{
	internal class EmbeddedResourceService : Telligent.Evolution.Mobile.PushNotifications.Services.IEmbeddedResourceService
	{
		#region IEmbeddedResourceService Members

		public string GetString(string path)
		{
			using (System.IO.Stream stream = GetStream(path))
			{
				byte[] data = new byte[stream.Length];
				stream.Read(data, 0, data.Length);
				var text = Encoding.UTF8.GetString(data);
				if (text[0] > 255)
					return text.Substring(1);
				else
					return text;
			}
		}

		public Stream GetStream(string path)
		{
			return typeof(EmbeddedResourceService).Assembly.GetManifestResourceStream(path);
		}

		#endregion
	}
}
