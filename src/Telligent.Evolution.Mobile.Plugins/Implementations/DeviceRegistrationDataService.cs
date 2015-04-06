using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data;
using System.Data.SqlClient;
using System.Text.RegularExpressions;
using Telligent.Evolution.Mobile.PushNotifications.Model;

namespace Telligent.Evolution.Mobile.PushNotifications.Implementations
{
	internal class DeviceRegistrationDataService : Telligent.Evolution.Mobile.PushNotifications.Services.IDeviceRegistrationDataService
	{
		private readonly Telligent.Evolution.Mobile.PushNotifications.Services.IEmbeddedResourceService EmbeddedResources;

		internal DeviceRegistrationDataService(Telligent.Evolution.Mobile.PushNotifications.Services.IEmbeddedResourceService embeddedResources)
		{
			EmbeddedResources = embeddedResources;
		}

		#region IDeviceRegistrationDataService Members

		public IEnumerable<UserDeviceRegistration> GetDevices(int userId)
		{
			List<UserDeviceRegistration> registrations = new List<UserDeviceRegistration>();

			using (var connection = GetSqlConnection())
			{
				using (var command = new SqlCommand("SELECT [UserId], [Token], [Device] FROM te_Mobile_PushDeviceRegistrations WHERE UserId = @UserId", connection))
				{
					command.Parameters.Add(new SqlParameter("UserId", userId));

					connection.Open();
					using (var reader = command.ExecuteReader())
					{
						while (reader.Read())
						{
							registrations.Add(new UserDeviceRegistration { Token = reader.GetString(1), Type = (DeviceType)reader.GetInt32(2), UserId = reader.GetInt32(0) });
						}
					}
					connection.Close();
				}
			}

			return registrations;
		}

		public void RegisterDevice(int userId, string token, DeviceType type)
		{
			using (var connection = GetSqlConnection())
			{
				using (var command = new SqlCommand(@"
IF NOT EXISTS (SELECT 1 FROM te_Mobile_PushDeviceRegistrations WHERE Token = @Token AND UserId = @UserId AND Device = @Device) BEGIN

	DELETE FROM te_Mobile_PushDeviceRegistrations
	WHERE Token = @Token

	INSERT INTO te_Mobile_PushDeviceRegistrations ([UserId], [Token], [Device])
	VALUES (@UserId, @Token, @Device)

END", connection))
				{
					command.Parameters.Add(new SqlParameter("UserId", userId));
					command.Parameters.Add(new SqlParameter("Token", token));
					command.Parameters.Add(new SqlParameter("Device", (int)type));

					connection.Open();
					command.ExecuteNonQuery();
					connection.Close();
				}
			}
		}

		public void UnregisterDevice(int? userId, string token, DeviceType? type)
		{
			using (var connection = GetSqlConnection())
			{
				using (var command = new SqlCommand(@"DELETE FROM te_Mobile_PushDeviceRegistrations WHERE Token = @Token AND (UserId = @UserId or @UserId IS NULL) AND (Device = @Device OR @Device IS NULL)", connection))
				{
					command.Parameters.Add(new SqlParameter("UserId", userId.HasValue ? (object) userId.Value : DBNull.Value));
					command.Parameters.Add(new SqlParameter("Token", token));
					command.Parameters.Add(new SqlParameter("Device", type.HasValue ? (object) type.Value : DBNull.Value));

					connection.Open();
					command.ExecuteNonQuery();
					connection.Close();
				}
			}
		}

		public bool IsConnectionStringValid()
		{
			bool isValid = false;

			if (!string.IsNullOrEmpty(ConnectionString))
			{
				try
				{
					using (var connection = GetSqlConnection())
					{
						using (var command = new SqlCommand("SELECT CASE IS_MEMBER('db_owner') WHEN 1 THEN 1 ELSE IS_MEMBER('db_ddladmin') END As DdlAdmin", connection))
						{
							connection.Open();
							using (var reader = command.ExecuteReader())
							{
								isValid = reader.Read() && Convert.ToBoolean(reader["DdlAdmin"]);
							}
							connection.Close();
						}
					}
				}
				catch
				{
					isValid = false;
				}
			}

			return isValid;
		}

		public string ConnectionString
		{
			get;
			set;
		}

		public void Install()
		{
			using (var connection = GetSqlConnection())
			{
				connection.Open();
				foreach (string statement in GetStatementsFromSqlBatch(EmbeddedResources.GetString("Telligent.Evolution.Mobile.Plugins.Resources.install.sql")))
				{
					using (var command = new SqlCommand(statement, connection))
					{
						command.ExecuteNonQuery();
					}
				}
				connection.Close();
			}
		}

		#endregion

		#region Helpers

		private IEnumerable<string> GetStatementsFromSqlBatch(string sqlBatch)
		{
			// This isn't as reliable as the SQL Server SDK, but works for most SQL batches and prevents another assembly reference
			foreach (string statement in Regex.Split(sqlBatch, @"^\s*GO\s*$", RegexOptions.IgnoreCase | RegexOptions.Multiline))
			{
				string sanitizedStatement = Regex.Replace(statement, @"(?:^SET\s+.*?$|\/\*.*?\*\/|--.*?$)", "\r\n", RegexOptions.IgnoreCase | RegexOptions.Multiline).Trim();
				if (sanitizedStatement.Length > 0)
					yield return sanitizedStatement;
			}
		}

		private SqlConnection GetSqlConnection()
		{
			return new SqlConnection(ConnectionString);
		}

		#endregion
	}
}
