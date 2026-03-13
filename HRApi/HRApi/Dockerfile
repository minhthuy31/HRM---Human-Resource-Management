FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["HRApi.csproj", "./"]
RUN dotnet restore "HRApi.csproj"
COPY . .
RUN dotnet publish "HRApi.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
COPY EmailTemplates ./EmailTemplates
# Tạo thư mục chứa ảnh để không bị lỗi khi upload
RUN mkdir -p /app/wwwroot/images /app/wwwroot/contracts
EXPOSE 8080
ENTRYPOINT ["dotnet", "HRApi.dll"]