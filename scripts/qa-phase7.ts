import {
  config,
} from "dotenv";

config({
  path:
    ".env.local",
});

type QaIssue = {
  level:
    | "FAIL"
    | "WARN";
  code: string;
  message: string;
};

async function main() {
  const {
    db,
    createPool,
  } =
    await import(
      "../src/db"
    );

  const schema =
    await import(
      "../src/db/schema"
    );

  const {
    assistanceApplicationPhotos,
    assistanceApplications,
    campaigns,
    donations,
    emailVerificationCodes,
    financialTransactions,
    programs,
    users,
  } = schema;

  const issues:
    QaIssue[] = [];

  const fail = (
    code: string,
    message: string,
  ) => {
    issues.push({
      level: "FAIL",
      code,
      message,
    });
  };

  const warn = (
    code: string,
    message: string,
  ) => {
    issues.push({
      level: "WARN",
      code,
      message,
    });
  };

  try {
    const [
      programRows,
      userRows,
      verificationRows,
      applicationRows,
      photoRows,
      campaignRows,
      donationRows,
      transactionRows,
    ] =
      await Promise.all([
        db
          .select()
          .from(programs),
        db
          .select()
          .from(users),
        db
          .select()
          .from(
            emailVerificationCodes,
          ),
        db
          .select()
          .from(
            assistanceApplications,
          ),
        db
          .select()
          .from(
            assistanceApplicationPhotos,
          ),
        db
          .select()
          .from(campaigns),
        db
          .select()
          .from(donations),
        db
          .select()
          .from(
            financialTransactions,
          ),
      ]);

    const programMap =
      new Map(
        programRows.map(
          (row) => [
            row.id,
            row,
          ],
        ),
      );

    const userMap =
      new Map(
        userRows.map(
          (row) => [
            row.id,
            row,
          ],
        ),
      );

    const applicationMap =
      new Map(
        applicationRows.map(
          (row) => [
            row.id,
            row,
          ],
        ),
      );

    const campaignMap =
      new Map(
        campaignRows.map(
          (row) => [
            row.id,
            row,
          ],
        ),
      );

    const donationMap =
      new Map(
        donationRows.map(
          (row) => [
            row.id,
            row,
          ],
        ),
      );

    const photosByApplication =
      new Map<
        string,
        typeof photoRows
      >();

    for (
      const photo of
      photoRows
    ) {
      const list =
        photosByApplication.get(
          photo.applicationId,
        ) || [];

      list.push(photo);

      photosByApplication.set(
        photo.applicationId,
        list,
      );
    }

    for (
      const code of
      verificationRows
    ) {
      const user =
        userMap.get(
          code.userId,
        );

      if (!user) {
        fail(
          "OTP_ORPHAN",
          `Kode verifikasi ${code.id} tidak memiliki user.`,
        );
        continue;
      }

      if (
        user.role !==
        "USER"
      ) {
        fail(
          "OTP_STAFF",
          `Kode verifikasi masih terkait akun staff ${user.id}.`,
        );
      }

      if (
        user.emailVerifiedAt
      ) {
        warn(
          "OTP_VERIFIED_USER",
          `Kode verifikasi masih tersisa untuk user terverifikasi ${user.id}.`,
        );
      }
    }

    for (
      const application of
      applicationRows
    ) {
      const program =
        programMap.get(
          application.programId,
        );

      if (!program) {
        fail(
          "APPLICATION_PROGRAM",
          `Pengajuan ${application.id} tidak memiliki program valid.`,
        );
      }

      const applicant =
        userMap.get(
          application.applicantId,
        );

      if (
        !applicant ||
        applicant.role !==
          "USER"
      ) {
        fail(
          "APPLICATION_APPLICANT",
          `Pengajuan ${application.id} tidak terkait USER yang valid.`,
        );
      }

      const photos =
        photosByApplication.get(
          application.id,
        ) || [];

      if (
        photos.length > 5
      ) {
        fail(
          "APPLICATION_PHOTO_MAX",
          `Pengajuan ${application.id} memiliki lebih dari 5 foto.`,
        );
      }

      if (
        application.status ===
          "SUBMITTED" ||
        application.status ===
          "APPROVED" ||
        application.status ===
          "REJECTED"
      ) {
        const required = [
          application.title,
          application.beneficiaryName,
          application.applicantRelationship,
          application.contactWhatsapp,
          application.village,
          application.subdistrict,
          application.regency,
          application.detailedAddress,
          application.conditionDescription,
        ];

        if (
          required.some(
            (value) =>
              !value?.trim(),
          )
        ) {
          fail(
            "APPLICATION_REQUIRED",
            `Pengajuan ${application.id} berstatus ${application.status} tetapi data wajib tidak lengkap.`,
          );
        }

        if (
          Number(
            application.targetAmount,
          ) <= 0
        ) {
          fail(
            "APPLICATION_TARGET",
            `Pengajuan ${application.id} memiliki target tidak valid.`,
          );
        }

        if (
          !application.truthConsent
        ) {
          fail(
            "APPLICATION_CONSENT",
            `Pengajuan ${application.id} belum memiliki persetujuan kebenaran data.`,
          );
        }

        if (
          photos.length < 2
        ) {
          fail(
            "APPLICATION_PHOTO_MIN",
            `Pengajuan ${application.id} memiliki kurang dari 2 foto.`,
          );
        }

        if (
          !application.submittedAt
        ) {
          fail(
            "APPLICATION_SUBMITTED_AT",
            `Pengajuan ${application.id} tidak memiliki submittedAt.`,
          );
        }
      }

      if (
        application.status ===
        "APPROVED" &&
        !campaignRows.some(
          (campaign) =>
            campaign.applicationId ===
            application.id,
        )
      ) {
        fail(
          "APPROVED_WITHOUT_CAMPAIGN",
          `Pengajuan APPROVED ${application.id} belum memiliki kampanye.`,
        );
      }

      for (
        const photo of photos
      ) {
        if (
          photo.storagePath &&
          applicant &&
          !photo.storagePath.startsWith(
            `media/pengajuan/${applicant.id}/`,
          )
        ) {
          fail(
            "PHOTO_OWNERSHIP_PATH",
            `Path foto ${photo.id} tidak sesuai pemilik pengajuan.`,
          );
        }

        if (
          !photo.storagePath
        ) {
          warn(
            "PHOTO_STORAGE_PATH_MISSING",
            `Foto ${photo.id} belum memiliki storagePath.`,
          );
        }
      }
    }

    for (
      const campaign of
      campaignRows
    ) {
      const application =
        applicationMap.get(
          campaign.applicationId,
        );

      if (
        !application ||
        application.status !==
          "APPROVED"
      ) {
        fail(
          "CAMPAIGN_APPLICATION",
          `Kampanye ${campaign.id} tidak terkait pengajuan APPROVED.`,
        );
        continue;
      }

      if (
        campaign.programId !==
        application.programId
      ) {
        fail(
          "CAMPAIGN_PROGRAM",
          `Program kampanye ${campaign.id} berbeda dari pengajuannya.`,
        );
      }

      if (
        Number(
          campaign.targetAmount,
        ) <= 0
      ) {
        fail(
          "CAMPAIGN_TARGET",
          `Target kampanye ${campaign.id} tidak valid.`,
        );
      }

      if (
        campaign.coverPhotoId
      ) {
        const photo =
          photoRows.find(
            (item) =>
              item.id ===
              campaign.coverPhotoId,
          );

        if (
          !photo ||
          photo.applicationId !==
            campaign.applicationId
        ) {
          fail(
            "CAMPAIGN_COVER",
            `Foto sampul kampanye ${campaign.id} bukan milik pengajuannya.`,
          );
        }
      }

      if (
        campaign.status ===
        "ACTIVE" ||
        campaign.status ===
        "COMPLETED"
      ) {
        if (
          !campaign.title.trim() ||
          !campaign.summary.trim() ||
          !campaign.story.trim() ||
          !campaign.publicLocation?.trim() ||
          !campaign.coverPhotoId
        ) {
          fail(
            "CAMPAIGN_PUBLIC_FIELDS",
            `Kampanye publik ${campaign.id} belum lengkap.`,
          );
        }

        if (
          !campaign.activatedAt
        ) {
          fail(
            "CAMPAIGN_ACTIVATED_AT",
            `Kampanye ${campaign.id} publik tanpa activatedAt.`,
          );
        }
      }

      if (
        campaign.status ===
          "COMPLETED" &&
        !campaign.completedAt
      ) {
        fail(
          "CAMPAIGN_COMPLETED_AT",
          `Kampanye selesai ${campaign.id} tanpa completedAt.`,
        );
      }
    }

    const proofOwners =
      new Map<
        string,
        string
      >();

    for (
      const donation of
      donationRows
    ) {
      if (
        donation.proofImage
      ) {
        const existing =
          proofOwners.get(
            donation.proofImage,
          );

        if (
          existing &&
          existing !==
            donation.id
        ) {
          fail(
            "DONATION_PROOF_DUPLICATE",
            `Bukti transfer digunakan lebih dari sekali: ${existing} dan ${donation.id}.`,
          );
        } else {
          proofOwners.set(
            donation.proofImage,
            donation.id,
          );
        }
      }

      if (
        donation.campaignId
      ) {
        const campaign =
          campaignMap.get(
            donation.campaignId,
          );

        if (!campaign) {
          fail(
            "DONATION_CAMPAIGN",
            `Donasi ${donation.id} menunjuk kampanye yang tidak ada.`,
          );
        } else if (
          donation.programId !==
          campaign.programId
        ) {
          fail(
            "DONATION_PROGRAM",
            `Program donasi ${donation.id} berbeda dari kampanyenya.`,
          );
        }
      }

      const linked =
        transactionRows.filter(
          (transaction) =>
            transaction.donationId ===
            donation.id &&
            !transaction.deletedAt,
        );

      if (
        donation.status ===
          "SUCCESS"
      ) {
        if (
          linked.length === 0
        ) {
          warn(
            "SUCCESS_DONATION_WITHOUT_LEDGER",
            `Donasi SUCCESS ${donation.id} belum memiliki transaksi ledger.`,
          );
        }

        if (
          linked.length > 1
        ) {
          fail(
            "DONATION_LEDGER_DUPLICATE",
            `Donasi ${donation.id} memiliki lebih dari satu transaksi ledger.`,
          );
        }
      } else if (
        linked.length > 0
      ) {
        fail(
          "NON_SUCCESS_DONATION_LEDGER",
          `Donasi ${donation.id} belum SUCCESS tetapi sudah masuk ledger.`,
        );
      }
    }

    for (
      const transaction of
      transactionRows
    ) {
      if (
        transaction.deletedAt
      ) {
        continue;
      }

      if (
        transaction.campaignId
      ) {
        const campaign =
          campaignMap.get(
            transaction.campaignId,
          );

        if (!campaign) {
          fail(
            "LEDGER_CAMPAIGN",
            `Transaksi ${transaction.id} menunjuk kampanye yang tidak ada.`,
          );
        } else if (
          transaction.programId !==
          campaign.programId
        ) {
          fail(
            "LEDGER_PROGRAM",
            `Program transaksi ${transaction.id} berbeda dari kampanyenya.`,
          );
        }
      }

      if (
        transaction.donationId
      ) {
        const donation =
          donationMap.get(
            transaction.donationId,
          );

        if (!donation) {
          fail(
            "LEDGER_DONATION",
            `Transaksi ${transaction.id} menunjuk donasi yang tidak ada.`,
          );
          continue;
        }

        if (
          transaction.type !==
          "IN"
        ) {
          fail(
            "DONATION_LEDGER_TYPE",
            `Transaksi donasi ${transaction.id} bukan IN.`,
          );
        }

        if (
          donation.status !==
          "SUCCESS"
        ) {
          fail(
            "DONATION_LEDGER_STATUS",
            `Transaksi ${transaction.id} terkait donasi yang belum SUCCESS.`,
          );
        }

        if (
          transaction.programId !==
          donation.programId ||
          transaction.campaignId !==
          donation.campaignId
        ) {
          fail(
            "DONATION_LEDGER_SCOPE",
            `Scope transaksi ${transaction.id} berbeda dari donasinya.`,
          );
        }
      }
    }

    for (
      const campaign of
      campaignRows
    ) {
      let incoming = 0;
      let outgoing = 0;

      for (
        const transaction of
        transactionRows
      ) {
        if (
          transaction.deletedAt ||
          transaction.campaignId !==
            campaign.id
        ) {
          continue;
        }

        const amount =
          Number(
            transaction.amount,
          );

        if (
          !Number.isFinite(
            amount,
          )
        ) {
          fail(
            "LEDGER_AMOUNT",
            `Nominal transaksi ${transaction.id} bukan angka valid.`,
          );
          continue;
        }

        if (
          transaction.type ===
          "IN"
        ) {
          incoming += amount;
        } else {
          outgoing += amount;
        }
      }

      if (
        incoming - outgoing <
        0
      ) {
        fail(
          "CAMPAIGN_NEGATIVE_BALANCE",
          `Saldo kampanye ${campaign.id} minus Rp${Math.abs(
            incoming -
              outgoing,
          ).toLocaleString(
            "id-ID",
          )}.`,
        );
      }
    }

    const failures =
      issues.filter(
        (issue) =>
          issue.level ===
          "FAIL",
      );

    const warnings =
      issues.filter(
        (issue) =>
          issue.level ===
          "WARN",
      );

    console.log(
      "\n============================================",
    );
    console.log(
      "QA DATABASE FASE 7",
    );
    console.log(
      "============================================",
    );
    console.log(
      `Program: ${programRows.length}`,
    );
    console.log(
      `User: ${userRows.length}`,
    );
    console.log(
      `Pengajuan: ${applicationRows.length}`,
    );
    console.log(
      `Kampanye: ${campaignRows.length}`,
    );
    console.log(
      `Donasi: ${donationRows.length}`,
    );
    console.log(
      `Transaksi: ${transactionRows.length}`,
    );
    console.log(
      `FAIL: ${failures.length}`,
    );
    console.log(
      `WARN: ${warnings.length}`,
    );

    for (
      const issue of
      issues
    ) {
      console.log(
        `[${issue.level}] ${issue.code}: ${issue.message}`,
      );
    }

    if (
      failures.length > 0
    ) {
      process.exitCode = 1;
      return;
    }

    console.log(
      "STATUS: PASS",
    );
  } finally {
    await createPool().end();
  }
}

main().catch(
  (error) => {
    console.error(
      "QA Fase 7 gagal:",
      error,
    );
    process.exitCode = 1;
  },
);
