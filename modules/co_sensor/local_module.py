import module
import fields
import fields.io
import fields.sensor
import fields.persistant
import fields.syntax

class COSensor(module.Base):
    update_rate = 10

    class value(fields.syntax.Percentage,
            fields.sensor.CO,
            fields.io.Graphable,
            fields.persistant.Database,
            fields.Base):
        public_name = 'Taux de CO (ppm)'
