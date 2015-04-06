SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[te_Mobile_PushDeviceRegistrations]') AND type in (N'U'))
BEGIN
	CREATE TABLE [dbo].te_Mobile_PushDeviceRegistrations(
		UserId int NOT NULL,
		Token nvarchar(256) NOT NULL,
		Device int NOT NULL,
	 CONSTRAINT [PK_Mobile_PushDeviceRegistrations] PRIMARY KEY CLUSTERED 
	(
		[Token]
	) WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
	) ON [PRIMARY]
END
GO