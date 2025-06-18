import openslide

slide = openslide.open_slide('C:/temp/deid/input/E22-02_ABETA_2.svs')
level_dim = slide.level_dimensions
for i in range(len(level_dim)):
    print("Level {} dimensions {}".format(i, level_dim[i]))
for i in range(len(level_dim)):
    lev_d = level_dim[i]
    lev_x = lev_d[0]
    lev_y = lev_d[1]
    print("Level {} dimensions x:{} y:{}".format(i, lev_x, lev_y))
    j = lev_x // 2
    k = lev_y // 2
    j = lev_x / j
    k = lev_y / k
    try:
        print("J {}, K {}".format(j, k))
        region = slide.read_region((0, 0), i, (2, 2))
        print("Region : {}".format(region))
    except Exception as e:
        print("Error {}".format(e))

pass