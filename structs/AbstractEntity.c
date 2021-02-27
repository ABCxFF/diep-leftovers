struct AbstractEntity {
    //** Entity Management Section **//

    // Self Ent Pointer @00
    // - points to itself
    struct AbstractEntity* self; // @00
    int32_t unknown0; // @04

    // Prev Ent Pointer @08
    // - Points to the prev entity received, or something like that
    struct AbstractEntity* prev_elem; // @08


    // Next Ent Pointer @0C
    // - Points to the next entity received, or something like that
    struct AbstractEntity* next_elem; // @0C

    //** Empty Section **//
    // Self Ent Pointer @10
    // - points to this entity
    struct AbstractEntity* self_ptr1; // @10
    char _gap_0[12];

    //** Empty Section **//
    // Self Ent Pointer @20
    // - points to this entity
    struct AbstractEntity* self_ptr2; // @20
    char _gap_1[12];



    //** Entity Identification Section **//

    // Self Ent Pointer @30
    // - points to this entity
    struct AbstractEntity* self_ptr3; // @30

    // Unknown value
    uint16_t unknown1; // @34
    // Entity id, part of the <id, hash> representation system
    uint16_t id; // @36
    // Entity hash, part of the <id, hash> representation system
    uint32_t hash; // @38
    char _gap_2[4];



    // Pretty sure this is per client, not server. The emscripten_get_now of when it was created
    double entity_creation_time; // @40

    // 16 Field Groups, all pointing to a FieldGroup struct (will be written later)
    // 0 : OWNERS
    // 1 :
    // 2 : BARREL
    // 3 : PHYSICS
    // 4 : HEALTH
    // 5 :
    // 6 : UNKNOWN
    // 7 : ARENA
    // 8 : NAME
    // 9 : GUI
    // 10: POS
    // 11: STYLE
    // 12:
    // 13: SCORE
    // 14: TEAM
    // 15:
    struct AbstractFieldGroup* field_groups[16]; // @48
}
