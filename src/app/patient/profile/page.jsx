import { redirect } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  FileHeart,
  HeartPulse,
  Home,
  Phone,
  Save,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";

export const metadata = {
  title: "Patient Profile",
  description:
    "Create and update your MediAssist personal and medical profile.",
};

export const dynamic = "force-dynamic";

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];

const GENDER_OPTIONS = [
  {
    value: "male",
    label: "Male",
  },
  {
    value: "female",
    label: "Female",
  },
  {
    value: "other",
    label: "Other",
  },
  {
    value: "prefer_not_to_say",
    label: "Prefer not to say",
  },
];

export default async function PatientProfilePage({
  searchParams,
}) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.PATIENT
  ) {
    redirect("/unauthorized");
  }

  const resolvedSearchParams = await searchParams;

  const updated =
    resolvedSearchParams?.updated === "true";

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  const profileData =
    await getPatientProfileData(
      session.user.id
    );

  if (!profileData) {
    redirect("/login");
  }

  return (
    <div className="dashboard-container">
      <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm sm:p-8 lg:flex lg:items-start lg:justify-between">
        <div className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex w-full flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Personal Health Record
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Medical Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Complete your personal, medical, and emergency information
            so doctors have accurate health context during appointments.
          </p>
        </div>

        <ProfileCompletionCard
          profile={profileData.profile}
        />
        </div>
      </header>

      {updated && (
        <AlertMessage
          type="success"
          title="Profile successfully updated"
          message="Your personal and medical information has been saved."
        />
      )}

      {error && (
        <ProfileErrorAlert error={error} />
      )}

      <form
        action={savePatientProfile}
        className="mt-6 space-y-6"
      >
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
          <SectionHeader
            icon={UserRound}
            title="Personal Information"
            description="Basic identity and contact details."
          />

          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
            <ReadOnlyField
              label="Full name"
              value={profileData.user.name}
            />

            <ReadOnlyField
              label="Email address"
              value={profileData.user.email}
            />

            <FormField
              id="phone"
              label="Phone number"
              required
            >
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                minLength={7}
                maxLength={20}
                defaultValue={profileData.user.phone}
                placeholder="03001234567"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="dateOfBirth"
              label="Date of birth"
              required
            >
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                max={getTodayDateInput()}
                defaultValue={
                  profileData.profile.dateOfBirth
                }
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="gender"
              label="Gender"
              required
            >
              <select
                id="gender"
                name="gender"
                required
                defaultValue={
                  profileData.profile.gender
                }
                className={inputClasses}
              >
                <option value="">
                  Select gender
                </option>

                {GENDER_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="bloodGroup"
              label="Blood group"
              required
            >
              <select
                id="bloodGroup"
                name="bloodGroup"
                required
                defaultValue={
                  profileData.profile.bloodGroup
                }
                className={inputClasses}
              >
                <option value="">
                  Select blood group
                </option>

                {BLOOD_GROUPS.map(
                  (bloodGroup) => (
                    <option
                      key={bloodGroup}
                      value={bloodGroup}
                    >
                      {bloodGroup}
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
          <SectionHeader
            icon={HeartPulse}
            title="Medical History"
            description="Enter your health history clearly. Add multiple items on separate lines."
          />

          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
            <FormField
              id="allergies"
              label="Known allergies"
              description="Medicine, food or environmental allergies."
            >
              <textarea
                id="allergies"
                name="allergies"
                rows={5}
                maxLength={1500}
                defaultValue={
                  profileData.profile.allergies
                }
                placeholder={`Penicillin\nPeanuts\nDust`}
                className={textareaClasses}
              />
            </FormField>

            <FormField
              id="currentMedications"
              label="Current medications"
              description="Medicine name, dosage and frequency."
            >
              <textarea
                id="currentMedications"
                name="currentMedications"
                rows={5}
                maxLength={1500}
                defaultValue={
                  profileData.profile
                    .currentMedications
                }
                placeholder={`Metformin 500 mg - twice daily\nVitamin D - once daily`}
                className={textareaClasses}
              />
            </FormField>

            <FormField
              id="chronicConditions"
              label="Chronic conditions"
              description="Long-term medical conditions."
            >
              <textarea
                id="chronicConditions"
                name="chronicConditions"
                rows={5}
                maxLength={1500}
                defaultValue={
                  profileData.profile
                    .chronicConditions
                }
                placeholder={`Diabetes\nHypertension`}
                className={textareaClasses}
              />
            </FormField>

            <FormField
              id="previousSurgeries"
              label="Previous surgeries"
              description="Surgery name and approximate year."
            >
              <textarea
                id="previousSurgeries"
                name="previousSurgeries"
                rows={5}
                maxLength={1500}
                defaultValue={
                  profileData.profile
                    .previousSurgeries
                }
                placeholder="Appendix surgery - 2020"
                className={textareaClasses}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                id="familyMedicalHistory"
                label="Family medical history"
              description="Relevant medical conditions among parents or close family members."
              >
                <textarea
                  id="familyMedicalHistory"
                  name="familyMedicalHistory"
                  rows={5}
                  maxLength={2000}
                  defaultValue={
                    profileData.profile
                      .familyMedicalHistory
                  }
                  placeholder="Father has diabetes. Mother has hypertension."
                  className={textareaClasses}
                />
              </FormField>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
          <SectionHeader
            icon={Activity}
            title="Lifestyle Information"
            description="Lifestyle information helps doctors assess potential health risks."
          />

          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
            <FormField
              id="smokingStatus"
              label="Smoking status"
            >
              <select
                id="smokingStatus"
                name="smokingStatus"
                defaultValue={
                  profileData.profile
                    .smokingStatus
                }
                className={inputClasses}
              >
                <option value="never">
                  Never smoked
                </option>

                <option value="former">
                  Former smoker
                </option>

                <option value="occasional">
                  Occasional smoker
                </option>

                <option value="regular">
                  Regular smoker
                </option>

                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </FormField>

            <FormField
              id="alcoholUse"
              label="Alcohol use"
            >
              <select
                id="alcoholUse"
                name="alcoholUse"
                defaultValue={
                  profileData.profile
                    .alcoholUse
                }
                className={inputClasses}
              >
                <option value="never">
                  Never
                </option>

                <option value="occasional">
                  Occasional
                </option>

                <option value="regular">
                  Regular
                </option>

                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </FormField>

            <FormField
              id="exerciseFrequency"
              label="Exercise frequency"
            >
              <select
                id="exerciseFrequency"
                name="exerciseFrequency"
                defaultValue={
                  profileData.profile
                    .exerciseFrequency
                }
                className={inputClasses}
              >
                <option value="none">
                  No regular exercise
                </option>

                <option value="light">
                  Light - 1 to 2 days per week
                </option>

                <option value="moderate">
                  Moderate - 3 to 4 days per week
                </option>

                <option value="active">
                  Active - 5 or more days per week
                </option>
              </select>
            </FormField>

            <FormField
              id="dietaryPreferences"
              label="Dietary preferences"
            >
              <input
                id="dietaryPreferences"
                name="dietaryPreferences"
                type="text"
                maxLength={300}
                defaultValue={
                  profileData.profile
                    .dietaryPreferences
                }
                placeholder="Vegetarian, low salt, halal..."
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="heightCm"
              label="Height (cm)"
            >
              <input
                id="heightCm"
                name="heightCm"
                type="number"
                min="50"
                max="250"
                step="0.1"
                defaultValue={
                  profileData.profile.heightCm
                }
                placeholder="170"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="weightKg"
              label="Weight (kg)"
            >
              <input
                id="weightKg"
                name="weightKg"
                type="number"
                min="2"
                max="500"
                step="0.1"
                defaultValue={
                  profileData.profile.weightKg
                }
                placeholder="70"
                className={inputClasses}
              />
            </FormField>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
          <SectionHeader
            icon={ShieldAlert}
            title="Emergency Contact"
            description="A trusted person to contact in an emergency."
          />

          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
            <FormField
              id="emergencyContactName"
              label="Contact name"
              required
            >
              <input
                id="emergencyContactName"
                name="emergencyContactName"
                type="text"
                required
                minLength={2}
                maxLength={100}
                defaultValue={
                  profileData.profile
                    .emergencyContact.name
                }
                placeholder="Ahmed Khan"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="emergencyContactRelationship"
              label="Relationship"
              required
            >
              <input
                id="emergencyContactRelationship"
                name="emergencyContactRelationship"
                type="text"
                required
                minLength={2}
                maxLength={100}
                defaultValue={
                  profileData.profile
                    .emergencyContact.relationship
                }
                placeholder="Brother"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="emergencyContactPhone"
              label="Emergency phone"
              required
            >
              <input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="tel"
                required
                minLength={7}
                maxLength={20}
                defaultValue={
                  profileData.profile
                    .emergencyContact.phone
                }
                placeholder="03001234567"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="emergencyContactEmail"
              label="Emergency email"
            >
              <input
                id="emergencyContactEmail"
                name="emergencyContactEmail"
                type="email"
                maxLength={150}
                defaultValue={
                  profileData.profile
                    .emergencyContact.email
                }
                placeholder="contact@example.com"
                className={inputClasses}
              />
            </FormField>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
          <SectionHeader
            icon={Home}
            title="Address"
            description="Current residential address."
          />

          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField
                id="street"
                label="Street address"
                required
              >
                <input
                  id="street"
                  name="street"
                  type="text"
                  required
                  minLength={3}
                  maxLength={200}
                  defaultValue={
                    profileData.profile.address.street
                  }
                  placeholder="House 12, Street 4"
                  className={inputClasses}
                />
              </FormField>
            </div>

            <FormField
              id="area"
              label="Area"
            >
              <input
                id="area"
                name="area"
                type="text"
                maxLength={100}
                defaultValue={
                  profileData.profile.address.area
                }
                placeholder="Gulberg"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="city"
              label="City"
              required
            >
              <input
                id="city"
                name="city"
                type="text"
                required
                minLength={2}
                maxLength={100}
                defaultValue={
                  profileData.profile.address.city
                }
                placeholder="Lahore"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="state"
              label="Province or state"
            >
              <input
                id="state"
                name="state"
                type="text"
                maxLength={100}
                defaultValue={
                  profileData.profile.address.state
                }
                  placeholder="Punjab"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="postalCode"
              label="Postal code"
            >
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                maxLength={20}
                defaultValue={
                  profileData.profile.address.postalCode
                }
                placeholder="54000"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="country"
              label="Country"
              required
            >
              <input
                id="country"
                name="country"
                type="text"
                required
                minLength={2}
                maxLength={100}
                defaultValue={
                  profileData.profile.address.country
                }
                placeholder="Pakistan"
                className={inputClasses}
              />
            </FormField>
          </div>
        </section>

        <div className="sticky bottom-4 z-10 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-card/95 p-5 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">
              Save medical profile
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Update your information regularly, especially your
              allergies and current medications.
            </p>
          </div>

          <button
            type="submit"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Save
              className="size-4"
              aria-hidden="true"
            />

            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}

async function getPatientProfileData(userId) {
  await connectDB();

  const [user, profile] = await Promise.all([
    User.findOne({
      _id: userId,
      role: USER_ROLES.PATIENT,
    })
      .select("name email phone isActive")
      .lean(),

    PatientProfile.findOne({
      userId,
    }).lean(),
  ]);

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name || "Patient",
      email: user.email || "",
      phone: user.phone || "",
      isActive: user.isActive !== false,
    },

    profile: {
      dateOfBirth: formatDateForInput(
        profile?.dateOfBirth
      ),

      gender:
        profile?.gender || "",

      bloodGroup:
        profile?.bloodGroup || "",

      allergies: formatArrayForInput(
        profile?.allergies
      ),

      currentMedications:
        formatArrayForInput(
          profile?.currentMedications
        ),

      chronicConditions:
        formatArrayForInput(
          profile?.chronicConditions
        ),

      previousSurgeries:
        formatArrayForInput(
          profile?.previousSurgeries
        ),

      familyMedicalHistory:
        formatArrayForInput(
          profile?.familyMedicalHistory
        ),

      smokingStatus:
        profile?.smokingStatus || "never",

      alcoholUse:
        profile?.alcoholUse || "never",

      exerciseFrequency:
        profile?.exerciseFrequency || "none",

      dietaryPreferences:
        formatArrayForInput(
          profile?.dietaryPreferences,
          ", "
        ),

      heightCm:
        getNumericValue(
          profile?.heightCm ??
            profile?.height,
          ""
        ),

      weightKg:
        getNumericValue(
          profile?.weightKg ??
            profile?.weight,
          ""
        ),

      emergencyContact: {
        name:
          profile?.emergencyContact?.name ||
          "",

        relationship:
          profile?.emergencyContact
            ?.relationship || "",

        phone:
          profile?.emergencyContact?.phone ||
          "",

        email:
          profile?.emergencyContact?.email ||
          "",
      },

      address: {
        street:
          profile?.address?.street || "",

        area:
          profile?.address?.area || "",

        city:
          profile?.address?.city || "",

        state:
          profile?.address?.state || "",

        postalCode:
          profile?.address?.postalCode || "",

        country:
          profile?.address?.country ||
          "Pakistan",
      },

      profileCompleted:
        profile?.profileCompleted === true,

      profileCompletionPercentage:
        getStoredCompletion(profile),
    },
  };
}

async function savePatientProfile(formData) {
  "use server";

  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.PATIENT
  ) {
    redirect("/unauthorized");
  }

  const phone = sanitizeText(
    formData.get("phone"),
    20
  );

  const dateOfBirth = parseDate(
    formData.get("dateOfBirth")
  );

  const gender = sanitizeText(
    formData.get("gender"),
    50
  );

  const bloodGroup = sanitizeText(
    formData.get("bloodGroup"),
    10
  );

  const emergencyContactName =
    sanitizeText(
      formData.get(
        "emergencyContactName"
      ),
      100
    );

  const emergencyContactRelationship =
    sanitizeText(
      formData.get(
        "emergencyContactRelationship"
      ),
      100
    );

  const emergencyContactPhone =
    sanitizeText(
      formData.get(
        "emergencyContactPhone"
      ),
      20
    );

  const emergencyContactEmail =
    sanitizeText(
      formData.get(
        "emergencyContactEmail"
      ),
      150
    );

  const street = sanitizeText(
    formData.get("street"),
    200
  );

  const area = sanitizeText(
    formData.get("area"),
    100
  );

  const city = sanitizeText(
    formData.get("city"),
    100
  );

  const state = sanitizeText(
    formData.get("state"),
    100
  );

  const postalCode = sanitizeText(
    formData.get("postalCode"),
    20
  );

  const country = sanitizeText(
    formData.get("country"),
    100
  );

  if (
    phone.length < 7 ||
    !dateOfBirth ||
    !GENDER_OPTIONS.some(
      (option) => option.value === gender
    ) ||
    !BLOOD_GROUPS.includes(bloodGroup) ||
    emergencyContactName.length < 2 ||
    emergencyContactRelationship.length < 2 ||
    emergencyContactPhone.length < 7 ||
    street.length < 3 ||
    city.length < 2 ||
    country.length < 2
  ) {
    redirect(
      "/patient/profile?error=invalid-required-fields"
    );
  }

  if (dateOfBirth > new Date()) {
    redirect(
      "/patient/profile?error=invalid-date-of-birth"
    );
  }

  if (
    emergencyContactEmail &&
    !isValidEmail(emergencyContactEmail)
  ) {
    redirect(
      "/patient/profile?error=invalid-emergency-email"
    );
  }

  const heightCm = parseOptionalNumber(
    formData.get("heightCm"),
    50,
    250
  );

  const weightKg = parseOptionalNumber(
    formData.get("weightKg"),
    2,
    500
  );

  if (
    heightCm === "invalid" ||
    weightKg === "invalid"
  ) {
    redirect(
      "/patient/profile?error=invalid-body-measurements"
    );
  }

  const allergies = parseMultilineList(
    formData.get("allergies"),
    50,
    150
  );

  const currentMedications =
    parseMultilineList(
      formData.get(
        "currentMedications"
      ),
      50,
      150
    );

  const chronicConditions =
    parseMultilineList(
      formData.get(
        "chronicConditions"
      ),
      50,
      150
    );

  const previousSurgeries =
    parseMultilineList(
      formData.get(
        "previousSurgeries"
      ),
      50,
      150
    );

  const familyMedicalHistory =
    parseMultilineList(
      formData.get(
        "familyMedicalHistory"
      ),
      50,
      200
    );

  const dietaryPreferences =
    parseCommaSeparatedList(
      formData.get(
        "dietaryPreferences"
      ),
      20,
      100
    );

  const smokingStatus = sanitizeText(
    formData.get("smokingStatus"),
    50
  );

  const alcoholUse = sanitizeText(
    formData.get("alcoholUse"),
    50
  );

  const exerciseFrequency =
    sanitizeText(
      formData.get(
        "exerciseFrequency"
      ),
      50
    );

  await connectDB();

  const user = await User.findOne({
    _id: session.user.id,
    role: USER_ROLES.PATIENT,
  });

  if (!user) {
    redirect("/login");
  }

  user.phone = phone;
  await user.save();

  // Migrate legacy profiles that stored address as a plain string.
  await PatientProfile.updateOne(
    {
      userId: session.user.id,
      address: { $type: "string" },
    },
    { $unset: { address: "" } }
  );

  let profile =
    await PatientProfile.findOne({
      userId: session.user.id,
    });

  if (!profile) {
    profile = new PatientProfile({
      userId: session.user.id,
    });
  }

  profile.dateOfBirth = dateOfBirth;
  profile.gender = gender;
  profile.bloodGroup = bloodGroup;

  profile.allergies = allergies;
  profile.currentMedications =
    currentMedications;

  profile.chronicConditions =
    chronicConditions;

  profile.previousSurgeries =
    previousSurgeries;

  profile.familyMedicalHistory =
    familyMedicalHistory;

  profile.smokingStatus =
    smokingStatus || "never";

  profile.alcoholUse =
    alcoholUse || "never";

  profile.exerciseFrequency =
    exerciseFrequency || "none";

  profile.dietaryPreferences =
    dietaryPreferences;

  profile.heightCm =
    heightCm === null
      ? undefined
      : heightCm;

  profile.weightKg =
    weightKg === null
      ? undefined
      : weightKg;

  profile.emergencyContact = {
    name: emergencyContactName,
    relationship:
      emergencyContactRelationship,
    phone: emergencyContactPhone,
    email: emergencyContactEmail,
  };

  profile.address = {
    street,
    area,
    city,
    state,
    postalCode,
    country,
  };
  profile.city = city;

  const completionPercentage =
    calculateProfileCompletion({
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      street,
      city,
      country,
      allergies,
      currentMedications,
      chronicConditions,
      previousSurgeries,
      familyMedicalHistory,
      heightCm,
      weightKg,
    });

  profile.profileCompletionPercentage =
    completionPercentage;

  profile.profileCompleted =
    completionPercentage === 100;

  try {
    await profile.save();
  } catch (error) {
    if (error?.name === "ValidationError") {
      console.error("Patient profile validation failed:", error.message);
      redirect("/patient/profile?error=invalid-data");
    }

    throw error;
  }

  redirect(
    "/patient/profile?updated=true"
  );
}

function ProfileCompletionCard({
  profile,
}) {
  const completed =
    profile.profileCompleted;

  return (
    <div
      className={`relative flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-sm ${
        completed
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
      }`}
    >
      {completed ? (
        <CheckCircle2
          className="mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
      ) : (
        <FileHeart
          className="mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {completed
            ? "Medical profile complete"
            : "Complete your profile"}
        </p>

        <p className="mt-1 text-xs leading-5">
          Completion:{" "}
          {profile.profileCompletionPercentage}%
        </p>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/60">
          <div
            className="h-full rounded-full bg-current"
            style={{
              width: `${profile.profileCompletionPercentage}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileErrorAlert({ error }) {
  const messages = {
    "invalid-required-fields":
      "Please complete all required personal, emergency contact, and address fields.",

    "invalid-date-of-birth":
      "The date of birth cannot be in the future.",

    "invalid-emergency-email":
      "Emergency contact email must use a valid format.",

    "invalid-body-measurements":
      "Height and weight must be within the valid range.",
  };

  return (
    <AlertMessage
      type="error"
      title="Profile could not be saved"
      message={
        messages[error] ||
        "Please review your profile information and try again."
      }
    />
  );
}

function AlertMessage({
  type,
  title,
  message,
}) {
  const isSuccess =
    type === "success";

  const Icon = isSuccess
    ? CheckCircle2
    : CircleAlert;

  return (
    <div
      className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${
        isSuccess
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
      role={isSuccess ? "status" : "alert"}
    >
      <Icon
        className="mt-0.5 size-5 shrink-0"
        aria-hidden="true"
      />

      <div>
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6">
          {message}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-4 border-b bg-muted/20 p-5 sm:p-6">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Icon
          className="size-5"
          aria-hidden="true"
        />
      </span>

      <div>
        <h2 className="font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  description,
  required = false,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium"
      >
        {label}

        {required && (
          <span className="ml-1 text-destructive">
            *
          </span>
        )}
      </label>

      {description && (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      )}

      <div className="mt-2">
        {children}
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-sm font-medium">
        {label}
      </p>

      <div className="mt-2 flex h-11 items-center rounded-xl border bg-muted/40 px-3 text-sm text-muted-foreground">
        {value || "Not available"}
      </div>
    </div>
  );
}

const inputClasses =
  "focus-ring h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition hover:border-primary/30 focus:border-primary placeholder:text-muted-foreground";

const textareaClasses =
  "focus-ring w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm outline-none transition hover:border-primary/30 focus:border-primary placeholder:text-muted-foreground";

function sanitizeText(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function parseDate(value) {
  const parsedDate = new Date(
    String(value || "")
  );

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    return null;
  }

  return parsedDate;
}

function parseOptionalNumber(
  value,
  minimum,
  maximum
) {
  const text = String(value || "").trim();

  if (!text) {
    return null;
  }

  const number = Number(text);

  if (
    !Number.isFinite(number) ||
    number < minimum ||
    number > maximum
  ) {
    return "invalid";
  }

  return number;
}

function parseMultilineList(
  value,
  maximumItems,
  maximumItemLength
) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) =>
      item.trim().slice(
        0,
        maximumItemLength
      )
    )
    .filter(Boolean)
    .slice(0, maximumItems);
}

function parseCommaSeparatedList(
  value,
  maximumItems,
  maximumItemLength
) {
  return String(value || "")
    .split(",")
    .map((item) =>
      item.trim().slice(
        0,
        maximumItemLength
      )
    )
    .filter(Boolean)
    .slice(0, maximumItems);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function calculateProfileCompletion(data) {
  const requiredFields = [
    data.dateOfBirth,
    data.gender,
    data.bloodGroup,
    data.phone,
    data.emergencyContactName,
    data.emergencyContactPhone,
    data.street,
    data.city,
    data.country,
  ];

  const optionalMedicalFields = [
    data.allergies,
    data.currentMedications,
    data.chronicConditions,
    data.previousSurgeries,
    data.familyMedicalHistory,
    data.heightCm,
    data.weightKg,
  ];

  const requiredCompleted =
    requiredFields.filter(Boolean).length;

  const optionalCompleted =
    optionalMedicalFields.filter((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return value !== null &&
        value !== undefined &&
        value !== "";
    }).length;

  const requiredScore =
    (requiredCompleted /
      requiredFields.length) *
    80;

  const optionalScore =
    (optionalCompleted /
      optionalMedicalFields.length) *
    20;

  return Math.min(
    100,
    Math.round(
      requiredScore + optionalScore
    )
  );
}

function formatArrayForInput(
  value,
  separator = "\n"
) {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return (
          item?.name ||
          item?.value ||
          item?.condition ||
          item?.surgery ||
          ""
        );
      })
      .filter(Boolean)
      .join(separator);
  }

  return String(value);
}

function formatDateForInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getTodayDateInput() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function getNumericValue(
  value,
  fallback
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getStoredCompletion(profile) {
  if (!profile) {
    return 0;
  }

  const percentage = Number(
    profile.profileCompletionPercentage
  );

  if (Number.isFinite(percentage)) {
    return Math.min(
      100,
      Math.max(0, percentage)
    );
  }

  return profile.profileCompleted
    ? 100
    : 0;
}
