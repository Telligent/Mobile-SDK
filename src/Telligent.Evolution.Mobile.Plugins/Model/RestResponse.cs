using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Extensibility.Rest.Version2;

namespace Telligent.Evolution.Mobile.PushNotifications.Model
{
	public class RestResponse : IRestResponse
	{
		public object Data
		{
			get;
			set;
		}

		public string[] Errors
		{
			get;
			set;
		}

		public string Name
		{
			get;
			set;
		}
	}
}
