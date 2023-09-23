mongorestore ^
 --uri="mongodb://spajza-user:wMBYf52O94MM6qFR4GcVNJo@192.168.34.10:27015/spajza-dev?authSource=admin" ^
 --drop --gzip --archive="spajza-prod.zip" ^
 --nsFrom="inventory.*" --nsTo="inventory-dev.*"