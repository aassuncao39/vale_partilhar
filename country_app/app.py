from flask import Flask, render_template, request
import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from io import BytesIO
import base64
from CompareCountries import CompareCountries

app = Flask(__name__, template_folder='html')

# Load your GeoDataFrame here
# For example, using a shapefile:
gdf = gpd.read_file("https://r2.datahub.io/clvyjaryy0000la0cxieg4o8o/main/raw/data/countries.geojson")



@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        country1 = request.form['country1']
        country2 = request.form['country2']
        rotation = float(request.form['rotation'])
        crs1 = request.form['crs1']
        crs2 = request.form['crs2']

        # Instantiate your class
        comparison = CompareCountries(gdf, country1, country2, rotation, crs1, crs2)

        area_country1 = comparison.area_country1
        area_country2 = comparison.area_country2

        # Save the plot to a BytesIO object
        buf = BytesIO()
        comparison.fig.savefig(buf, format='png')
        buf.seek(0)
        image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')

        return render_template('result.html', image=image_base64, country1=area_country1, country2=area_country2)

    # For GET request, just render the form
    return render_template('index.html', gdf=gdf)

if __name__ == '__main__':
    app.run(debug=True)