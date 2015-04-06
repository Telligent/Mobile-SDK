using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Mobile.PushNotifications.Model;

namespace Telligent.Evolution.Mobile.PushNotifications.Services
{
	internal interface IDeviceRegistrationDataService
	{
		IEnumerable<UserDeviceRegistration> GetDevices(int userId);

		void RegisterDevice(int userId, string token, DeviceType type);

		void UnregisterDevice(int? userId, string token, DeviceType? type);

		bool IsConnectionStringValid();

		string ConnectionString { get; set; }

		void Install();
	}
}
