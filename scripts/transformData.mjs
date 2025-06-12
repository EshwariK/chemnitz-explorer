export function transformOverpassData(data) {
    const features = data.elements;

    function mapToCategory(props) {
        const tagMap = {
            museum: 'Museum',
            gallery: 'Gallery',
            artwork: 'Artwork',
            theatre: 'Theatre',
            restaurant: 'Restaurant',
            monument: 'Monument',
            memorial: 'Memorial',
            library: 'Library',
        };

        if (props.tourism && tagMap[props.tourism]) return tagMap[props.tourism];
        if (props.amenity && tagMap[props.amenity]) return tagMap[props.amenity];
        if (props.historic && tagMap[props.historic]) return tagMap[props.historic];
        if (props.art_gallery === 'yes') return 'Gallery';
        return 'Unknown';
    }

    return features.map((el) => ({
        externalId: `${el.type}/${el.id}`,
        name: el.tags?.name || 'Unknown',
        category: mapToCategory(el.tags || {}),
        coordinates: el.lat && el.lon ? { lat: el.lat, lng: el.lon } : { lat: el.center?.lat, lng: el.center?.lon },
        tags: el.tags || {},
        raw: el,
    })).filter(item => item.coordinates.lat && item.coordinates.lng);
}
