const fs = require('fs')
const { Random } = require('random-js')
const random = new Random();

// Init

let file = fs.readFileSync('./ruspini.csv', { encoding: 'utf8' })

let lines = []

file.split('\n').map((d, i) => lines.push(d.split(',')))

lines.map((d, i) => {
    if (Array.isArray(d)) {
        d.map((e, j) => {
            if (j > 0) {
                lines[i][j] = Number(e)
            }
        })
    }
})

lines.splice(0,1)

lines.map(d => d[0] = Number(d[0].replace('"', '').replace('"', '')))

// Tentukan K
const k = 4;

let x_min = () => {
    let min = 999;

    lines.map((d, i) => {
        if (d[1] < min) min = d[1]
    })

    return min
}

let x_max = () => {
    let max = 0

    lines.map((d, i) => {
        if (d[1] > max) max = d[1]
    })

    return max
}

let y_min = () => {
    let min = 999;

    lines.map((d, i) => {
        if (d[2] < min) min = d[2]
    })

    return min
}

let y_max = () => {
    let max = 0

    lines.map((d, i) => {
        if (d[2] > max) max = d[2]
    })

    return max
}

let init_centroid = Array.from(Array(k), (x, index) => ({ 
    x: random.integer(x_min(), x_max()),
    y: random.integer(y_min(), y_max()),
    cluster_label: `cluster_${index+1}`
}))

let transform = []

lines.map(d => {
    transform.push({
        value: d[0],
        x: d[1],
        y: d[2]
    })
})

let distance = (node1, node2) => {
    return Math.sqrt(Math.pow((node2.x - node1.x), 2) + Math.pow((node2.y - node1.y), 2))
}

let min_distance = (distances) => {
    let temp = {x: 0, y: 0, distance: 999}
    
    distances.map(d => {
        if (d.distance < temp.distance) temp = d
    })

    return temp
}

let search_centroid = (init_centroid) => {
    transform.map((d, i) => {
        let distances = []
    
        init_centroid.map(e => {
            e.distance = distance(d, e)
    
            distances.push(e)
        })
    
        transform[i].centroid = min_distance(distances)
    })
}

search_centroid(init_centroid)

let average = (group) => {
    let sum = {
        x: 0,
        y: 0
    };

    group.map(d => {
        sum.x += d.x
        sum.y += d.y
        sum.cluster_label = d.centroid.cluster_label
    })

    sum.x = sum.x / group.length
    sum.y = sum.y / group.length

    return sum
}

let new_centroid = Array(k)

let cluster_variance = (v_centroid, v_transform) => {
    let temp = Array(k)
    let variances = Array(k)

    Array.from(v_centroid).map((d, i) => {
        temp[i]  = v_transform.filter(x => x.centroid.cluster_label === d.cluster_label)
    })

    Array.from(temp).map((d, i) => {
        let arr_d = Array(Array.from(d).length)

        Array.from(d).map((e, j) => {
            let d = [e.x, e.y]
            let d1 = [e.centroid.x, e.centroid.y]

            // arr_d[j] = [ d[0] - d1[0], d[1] - d1[1] ]
            arr_d[j] = (d[0] - d1[0] * d[0] - d1[0]) + (d[1] - d1[1] * d[1] - d1[1])
        })
        
        let sum_d = 0;

        arr_d.map((e, j) => {
            sum_d += e
        })

        let v = (1 / Array.from(d).length - 1) * sum_d

        variances[i] = v

        console.log(`variance cluster ${d[0].centroid.cluster_label}: ${v}`)
    })

    let sum_variances = 0

    variances.map((d, i) => {
        sum_variances += (Array.from(temp[i]).length - 1) * d
    })

    
    let vw = 1 * sum_variances / (Array.from(v_transform).length - k)

    console.log(`Variance within cluster ${vw}`)

    let average_temp = [0, 0]

    Array.from(temp).map((d, i) => {
        average_temp[0] += d[0].centroid.x
        average_temp[1] += d[0].centroid.y
    })

    average_temp = [
        average_temp[0] / k,
        average_temp[1] / k
    ]

    let sum_vw_variances = Array(k)

    Array.from(temp).map((d, i) => {
        sum_vw_variances[i] = [d[0].centroid.x - average_temp[0], d[0].centroid.y - average_temp[1]]
    })

    let arr_n = Array(k)

    sum_vw_variances.map((d, i) => {
        arr_n[i] = (d[0] * d[0] + d[1] * d[1])
    })

    let sum_n = 0

    Array.from(temp).map((d, i) => {
        sum_n += Array.from(d).length * arr_n[i]
    })

    let vb = 1 * sum_n / (k - 1)

    console.log(`variance between cluster ${vb}`)

    console.log(`variance ${vw/vb}`)
}

let create_new_centroid = (init_centroid) => {
    init_centroid.map((d, i) => {
        let group = transform.filter(x => x.centroid.x === d.x && x.centroid.y === d.y)
    
        new_centroid[i] = average(group)
    })

    if (JSON.stringify(init_centroid) === JSON.stringify(new_centroid)) {
        // console.log('sama')
        // console.log('centroid lama: ', init_centroid)
        // console.log('centroid baru: ', new_centroid)
        // console.log(transform)
        // console.log('==========================================')
        cluster_variance(init_centroid, transform)
    } else {
        // console.log('beda')
        // console.log('centroid lama: ', init_centroid)
        // console.log('centroid baru: ', new_centroid)
        // console.log('==========================================')
        init_centroid = new_centroid
        search_centroid(init_centroid)
        create_new_centroid(init_centroid)
    }
}

create_new_centroid(init_centroid)