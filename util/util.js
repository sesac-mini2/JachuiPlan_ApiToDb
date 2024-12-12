function pick(obj, ...props) {
    return props.reduce((result, prop) => {
        if (obj.hasOwnProperty(prop))
            result[prop] = obj[prop];
        return result;
    }, {});
}

function objectToArray(obj, mapping) {
    return Object.entries(obj).map(([key, value]) => {
        const result = [];
        for (const [index, prop] of Object.entries(mapping)) {
            result[index] = value[prop];
        }
        return result;
    });
}


export { pick, objectToArray };
