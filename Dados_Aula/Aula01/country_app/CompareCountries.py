import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

class CompareCountries:

    def __init__(self, gdf, country1, country2, rotation, crs1, crs2):
        self.gdf = gdf
        self.country1 = country1 
        self.country2 = country2
        self.rotation = rotation
        self.crs1 = crs1
        self.crs2 = crs2

        front, back = self.filtering_countries()
        front_center, back_center = self.calculate_centroids(front, back)
        front_shifted = self.rotate_countries(front, front_center, back_center)

        self.fig = self.plot_countries(back, front, front_shifted)

        self.area_country2, self.area_country1 = self.calculate_area(front, back)

    def filtering_countries(self):
        # Select countries from GeoDataFrames:
        front = self.gdf[self.gdf['ADMIN'] == self.country2]
        back = self.gdf[self.gdf['ADMIN'] == self.country1]
        # Project to a CRS before calculating the centroid:
        front = front.to_crs(self.crs2)
        back = back.to_crs(self.crs1)
        return front, back


    def calculate_centroids(self, front, back):
        front_center = front.geometry.centroid.iloc[0]
        back_center = back.geometry.centroid.iloc[0]

        return front_center, back_center
    
    def rotate_countries(self, front, front_center, back_center):
    # Rotate COUNTRY2 around center by ROTATE value (0 = no rotation):
        front_rotated = front.set_geometry(front.rotate(self.rotation, origin='centroid'))

        # Shift foreground country to overlap background country:
        front_shifted = front_rotated.set_geometry(front_rotated.translate(
                                                xoff=back_center.x-front_center.x, 
                                                yoff=back_center.y-front_center.y))
        
        return front_shifted
        

    
    def plot_countries(self, back, front, front_shifted):

        fig, ax = plt.subplots(figsize=(8, 8))

        base = back.plot(ax = ax, color='white', edgecolor='black')

        front_shifted.plot(ax = ax, color='red', alpha=0.5)

        red_patch = mpatches.Patch(color='red', alpha=0.5, label=self.country2)
        plt.legend(handles=[red_patch], loc='best')

        plt.xticks([])
        plt.yticks([])

        # Add a title:
        plt.title(f"Comparação {self.country2} vs. {self.country1}")

        # Save plot (optional):
        #plt.savefig(f'{COUNTRY2} vs {COUNTRY1}.png', dpi=600)

        #plt.show()

        return fig
    
    def calculate_area(self, front, back):
        front['area_km2'] = (front.area / 10**6).round(6)
        back['area_km2'] = (back.area / 10**6).round(6)

        # Force fixed-point notation
        area1_front = f"Área do {self.country2} = {front.area_km2.apply(lambda x: f'{x:,.2f}').to_string(index=False)} km²"
        area2_back = f"Área do {self.country1} = {back.area_km2.apply(lambda x: f'{x:,.2f}').to_string(index=False)} km²"

        return area1_front, area2_back