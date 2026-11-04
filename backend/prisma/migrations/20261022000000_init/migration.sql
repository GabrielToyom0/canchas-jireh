BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[Usuario] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [nombre] NVARCHAR(100) NOT NULL,
    [correo] NVARCHAR(150) NOT NULL,
    [telefono] NVARCHAR(20) NOT NULL,
    [passwordHash] NVARCHAR(100) NOT NULL,
    [rol] NVARCHAR(20) NOT NULL CONSTRAINT [Usuario_rol_df] DEFAULT 'CLIENTE',
    [sedeId] UNIQUEIDENTIFIER,
    [activo] BIT NOT NULL CONSTRAINT [Usuario_activo_df] DEFAULT 1,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Usuario_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Usuario_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Usuario_correo_key] UNIQUE NONCLUSTERED ([correo])
);

-- CreateTable
CREATE TABLE [dbo].[RefreshToken] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [usuarioId] UNIQUEIDENTIFIER NOT NULL,
    [tokenHash] CHAR(64) NOT NULL,
    [expiraEn] DATETIME2 NOT NULL,
    [revocado] BIT NOT NULL CONSTRAINT [RefreshToken_revocado_df] DEFAULT 0,
    [reemplazadoEn] DATETIME2,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [RefreshToken_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [RefreshToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefreshToken_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

-- CreateTable
CREATE TABLE [dbo].[Sede] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [nombre] NVARCHAR(100) NOT NULL,
    [direccion] NVARCHAR(200) NOT NULL,
    [zona] NVARCHAR(50) NOT NULL,
    [telefono] NVARCHAR(20) NOT NULL,
    [horaApertura] CHAR(5) NOT NULL,
    [horaCierre] CHAR(5) NOT NULL,
    [activa] BIT NOT NULL CONSTRAINT [Sede_activa_df] DEFAULT 1,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Sede_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Sede_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Sede_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[Cancha] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [sedeId] UNIQUEIDENTIFIER NOT NULL,
    [nombre] NVARCHAR(100) NOT NULL,
    [deporte] NVARCHAR(20) NOT NULL,
    [superficie] NVARCHAR(50) NOT NULL,
    [capacidad] INT NOT NULL,
    [activa] BIT NOT NULL CONSTRAINT [Cancha_activa_df] DEFAULT 1,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Cancha_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Cancha_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Cancha_sedeId_nombre_key] UNIQUE NONCLUSTERED ([sedeId],[nombre])
);

-- CreateTable
CREATE TABLE [dbo].[Tarifa] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [canchaId] UNIQUEIDENTIFIER NOT NULL,
    [tipoDia] NVARCHAR(20) NOT NULL,
    [horaInicio] CHAR(5) NOT NULL,
    [horaFin] CHAR(5) NOT NULL,
    [precioHora] DECIMAL(10,2) NOT NULL,
    [vigenteDesde] DATE NOT NULL,
    [vigenteHasta] DATE,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Tarifa_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Tarifa_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Bloqueo] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [canchaId] UNIQUEIDENTIFIER NOT NULL,
    [inicio] DATETIME2 NOT NULL,
    [fin] DATETIME2 NOT NULL,
    [motivo] NVARCHAR(200) NOT NULL,
    [creadoPor] UNIQUEIDENTIFIER NOT NULL,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Bloqueo_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Bloqueo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Reserva] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [usuarioId] UNIQUEIDENTIFIER NOT NULL,
    [canchaId] UNIQUEIDENTIFIER NOT NULL,
    [sedeId] UNIQUEIDENTIFIER NOT NULL,
    [inicio] DATETIME2 NOT NULL,
    [fin] DATETIME2 NOT NULL,
    [estado] NVARCHAR(20) NOT NULL CONSTRAINT [Reserva_estado_df] DEFAULT 'PENDIENTE',
    [precioTotal] DECIMAL(10,2) NOT NULL,
    [expiraEn] DATETIME2,
    [canceladaEn] DATETIME2,
    [motivoCancelacion] NVARCHAR(200),
    [porcentajeReembolso] INT,
    [recordatorioEnviado] BIT NOT NULL CONSTRAINT [Reserva_recordatorioEnviado_df] DEFAULT 0,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Reserva_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [Reserva_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PoliticaCancelacion] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [sedeId] UNIQUEIDENTIFIER NOT NULL,
    [horasAntes] INT NOT NULL,
    [porcentajeReembolso] INT NOT NULL,
    CONSTRAINT [PoliticaCancelacion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PoliticaCancelacion_sedeId_horasAntes_key] UNIQUE NONCLUSTERED ([sedeId],[horasAntes])
);

-- CreateTable
CREATE TABLE [dbo].[Pago] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [reservaId] UNIQUEIDENTIFIER NOT NULL,
    [usuarioId] UNIQUEIDENTIFIER NOT NULL,
    [monto] DECIMAL(10,2) NOT NULL,
    [metodo] NVARCHAR(20) NOT NULL,
    [estado] NVARCHAR(20) NOT NULL CONSTRAINT [Pago_estado_df] DEFAULT 'PENDIENTE',
    [comprobanteUrl] NVARCHAR(200),
    [referenciaBanco] NVARCHAR(50),
    [ultimos4] CHAR(4),
    [motivoRechazo] NVARCHAR(200),
    [verificadoPor] UNIQUEIDENTIFIER,
    [verificadoEn] DATETIME2,
    [confirmadoEn] DATETIME2,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Pago_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    [actualizadoEn] DATETIME2 NOT NULL,
    CONSTRAINT [Pago_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Reembolso] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [pagoId] UNIQUEIDENTIFIER NOT NULL,
    [monto] DECIMAL(10,2) NOT NULL,
    [porcentaje] INT NOT NULL,
    [motivo] NVARCHAR(200) NOT NULL,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Reembolso_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Reembolso_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Reembolso_pagoId_key] UNIQUE NONCLUSTERED ([pagoId])
);

-- CreateTable
CREATE TABLE [dbo].[Notificacion] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [usuarioId] UNIQUEIDENTIFIER NOT NULL,
    [reservaId] UNIQUEIDENTIFIER NOT NULL,
    [tipo] NVARCHAR(30) NOT NULL,
    [canal] NVARCHAR(20) NOT NULL CONSTRAINT [Notificacion_canal_df] DEFAULT 'EMAIL',
    [destinatario] NVARCHAR(150) NOT NULL,
    [asunto] NVARCHAR(200) NOT NULL,
    [cuerpoHtml] NVARCHAR(max) NOT NULL,
    [cuerpoTexto] NVARCHAR(max) NOT NULL,
    [estado] NVARCHAR(20) NOT NULL CONSTRAINT [Notificacion_estado_df] DEFAULT 'PENDIENTE',
    [error] NVARCHAR(500),
    [intentos] INT NOT NULL CONSTRAINT [Notificacion_intentos_df] DEFAULT 0,
    [enviadaEn] DATETIME2,
    [creadoEn] DATETIME2 NOT NULL CONSTRAINT [Notificacion_creadoEn_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Notificacion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Notificacion_reservaId_tipo_key] UNIQUE NONCLUSTERED ([reservaId],[tipo])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Usuario_rol_idx] ON [dbo].[Usuario]([rol]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RefreshToken_usuarioId_idx] ON [dbo].[RefreshToken]([usuarioId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Cancha_sedeId_deporte_idx] ON [dbo].[Cancha]([sedeId], [deporte]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Tarifa_canchaId_tipoDia_idx] ON [dbo].[Tarifa]([canchaId], [tipoDia]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Bloqueo_canchaId_inicio_fin_idx] ON [dbo].[Bloqueo]([canchaId], [inicio], [fin]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reserva_canchaId_inicio_fin_idx] ON [dbo].[Reserva]([canchaId], [inicio], [fin]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reserva_usuarioId_inicio_idx] ON [dbo].[Reserva]([usuarioId], [inicio]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reserva_sedeId_inicio_idx] ON [dbo].[Reserva]([sedeId], [inicio]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reserva_estado_expiraEn_idx] ON [dbo].[Reserva]([estado], [expiraEn]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Pago_reservaId_idx] ON [dbo].[Pago]([reservaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Pago_usuarioId_creadoEn_idx] ON [dbo].[Pago]([usuarioId], [creadoEn]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Pago_estado_idx] ON [dbo].[Pago]([estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notificacion_estado_creadoEn_idx] ON [dbo].[Notificacion]([estado], [creadoEn]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notificacion_usuarioId_creadoEn_idx] ON [dbo].[Notificacion]([usuarioId], [creadoEn]);

-- AddForeignKey
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [Usuario_sedeId_fkey] FOREIGN KEY ([sedeId]) REFERENCES [dbo].[Sede]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Cancha] ADD CONSTRAINT [Cancha_sedeId_fkey] FOREIGN KEY ([sedeId]) REFERENCES [dbo].[Sede]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Tarifa] ADD CONSTRAINT [Tarifa_canchaId_fkey] FOREIGN KEY ([canchaId]) REFERENCES [dbo].[Cancha]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bloqueo] ADD CONSTRAINT [Bloqueo_canchaId_fkey] FOREIGN KEY ([canchaId]) REFERENCES [dbo].[Cancha]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Bloqueo] ADD CONSTRAINT [Bloqueo_creadoPor_fkey] FOREIGN KEY ([creadoPor]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reserva] ADD CONSTRAINT [Reserva_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reserva] ADD CONSTRAINT [Reserva_canchaId_fkey] FOREIGN KEY ([canchaId]) REFERENCES [dbo].[Cancha]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reserva] ADD CONSTRAINT [Reserva_sedeId_fkey] FOREIGN KEY ([sedeId]) REFERENCES [dbo].[Sede]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PoliticaCancelacion] ADD CONSTRAINT [PoliticaCancelacion_sedeId_fkey] FOREIGN KEY ([sedeId]) REFERENCES [dbo].[Sede]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Pago] ADD CONSTRAINT [Pago_reservaId_fkey] FOREIGN KEY ([reservaId]) REFERENCES [dbo].[Reserva]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Pago] ADD CONSTRAINT [Pago_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Pago] ADD CONSTRAINT [Pago_verificadoPor_fkey] FOREIGN KEY ([verificadoPor]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reembolso] ADD CONSTRAINT [Reembolso_pagoId_fkey] FOREIGN KEY ([pagoId]) REFERENCES [dbo].[Pago]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Notificacion] ADD CONSTRAINT [Notificacion_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Notificacion] ADD CONSTRAINT [Notificacion_reservaId_fkey] FOREIGN KEY ([reservaId]) REFERENCES [dbo].[Reserva]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
