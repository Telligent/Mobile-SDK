using System;
using System.Collections.Generic;
using System.Web.Routing;
using System.Text.RegularExpressions;

namespace Telligent.Evolution.Mobile.Web.Model
{
	internal class EmbeddedFile
	{
		internal EmbeddedFile(string name, string mimeType, byte[] data)
		{
			Name = name;
			MimeType = mimeType;
			Data = data;
		}

		public string Name { get; private set; }
		public byte[] Data { get; private set; }
		public string MimeType { get; private set; }
	}
}